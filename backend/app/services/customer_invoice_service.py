from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from models.models import Product, Tax, CustomerInvoice, CustomerInvoiceItem, SalesOrder, SalesOrderLine
from schemas.schemas import CustomerInvoiceCreate, CustomerInvoiceResponse


class CustomerInvoiceService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_invoices(self):
        stmt = select(CustomerInvoice).options(selectinload(CustomerInvoice.lines)).order_by(CustomerInvoice.created_at.desc())
        result = (await self.session.execute(stmt)).scalars().unique().all()
        return [CustomerInvoiceResponse.model_validate(inv) for inv in result]

    async def get_invoice(self, invoice_id):
        stmt = select(CustomerInvoice).options(selectinload(CustomerInvoice.lines)).where(CustomerInvoice.id == invoice_id)
        inv = (await self.session.execute(stmt)).scalar_one_or_none()
        if not inv:
            return None
        return CustomerInvoiceResponse.model_validate(inv)

    async def create_invoice(self, payload: CustomerInvoiceCreate) -> CustomerInvoiceResponse:
        invoice_number = str(uuid4())
        inv = CustomerInvoice(
            invoice_number=invoice_number,
            customer_id=payload.customer_id,
            customer_name=payload.customer_name,
            invoice_date=payload.invoice_date,
            due_date=payload.due_date,
        )
        self.session.add(inv)
        await self.session.flush()

        total_untaxed = 0.0
        total_tax = 0.0

        for line_in in payload.lines:
            product = None
            if getattr(line_in, 'product_id', None):
                product = (await self.session.execute(select(Product).where(Product.id == line_in.product_id))).scalar_one_or_none()
            if not product:
                product = (await self.session.execute(select(Product).where(Product.name == line_in.product_name))).scalar_one_or_none()
            if not product:
                raise ValueError(f"Product '{line_in.product_name}' not found")

            tax_percent = 0.0
            if product.tax_name:
                # Per requirement: use purchase tax percent for customer invoices
                tax_row = (await self.session.execute(
                    select(Tax).where(
                        Tax.name == product.tax_name,
                        Tax.is_applicable_on_purchase == True
                    )
                )).scalar_one_or_none()
                if tax_row and tax_row.computation_method == 'percentage':
                    tax_percent = float(tax_row.value)

            untaxed = line_in.quantity * line_in.unit_price
            tax_amount = round(float(untaxed) * (tax_percent / 100), 2)
            total = untaxed + tax_amount

            total_untaxed += float(untaxed)
            total_tax += float(tax_amount)

            item = CustomerInvoiceItem(
                customer_invoice_id=inv.id,
                product_id=product.id,
                product_name=product.name,
                hsn_code=product.hsn_code,
                account_id=getattr(line_in, 'account_id', None),
                quantity=line_in.quantity,
                unit_price=line_in.unit_price,
                tax_percent=tax_percent,
                untaxed_amount=untaxed,
                tax_amount=tax_amount,
                total_amount=total,
            )
            self.session.add(item)

        inv.total_untaxed = total_untaxed
        inv.total_tax = total_tax
        inv.total_amount = total_untaxed + total_tax

        await self.session.commit()

        # Re-query with selectinload to avoid async lazy-load after commit
        return await self.get_invoice(inv.id)

    async def create_invoice_from_sales_order(self, sales_order_id) -> CustomerInvoiceResponse:
        """Generate a draft customer invoice from a confirmed sales order.

        Previous behavior created a 'posted' invoice immediately and omitted HSN codes, making
        the frontend render as read-only and missing product meta. We now:
          * create invoice with status 'draft' so user can fill remaining fields (customer, dates)
          * hydrate line items with product HSN codes
        """
        so = (await self.session.execute(
            select(SalesOrder).options(selectinload(SalesOrder.lines)).where(SalesOrder.id == sales_order_id)
        )).scalar_one_or_none()
        if not so:
            raise ValueError("Sales Order not found")
        if so.status != 'confirmed':
            raise ValueError("Sales Order must be confirmed before creating an invoice")

        invoice_number = str(uuid4())
        inv = CustomerInvoice(
            invoice_number=invoice_number,
            customer_name=so.customer_name,  # carry over from sales order (can still edit)
            customer_id=getattr(so, 'customer_id', None),
            invoice_date=None,
            due_date=None,
            status='draft',  # allow user to review/edit before posting
        )
        self.session.add(inv)
        await self.session.flush()

        total_untaxed = 0.0
        total_tax = 0.0

        # Recompute amounts from lines to ensure consistency
        so_lines = (await self.session.execute(select(SalesOrderLine).where(SalesOrderLine.sales_order_id == so.id))).scalars().all()
        # Preload products for HSN lookup
        product_ids = {l.product_id for l in so_lines if l.product_id}
        products = {}
        if product_ids:
            prod_rows = (await self.session.execute(select(Product).where(Product.id.in_(product_ids)))).scalars().all()
            products = {p.id: p for p in prod_rows}

        for l in so_lines:
            untaxed = float(l.quantity) * float(l.unit_price)
            tax_amount = float(l.tax_amount)
            total = float(l.total_amount)

            total_untaxed += float(l.untaxed_amount)
            total_tax += float(l.tax_amount)

            prod = products.get(l.product_id)
            item = CustomerInvoiceItem(
                customer_invoice_id=inv.id,
                product_id=l.product_id,
                product_name=l.product_name,
                hsn_code=getattr(prod, 'hsn_code', None),
                account_id=None,
                quantity=l.quantity,
                unit_price=l.unit_price,
                tax_percent=l.tax_percent,
                untaxed_amount=untaxed,
                tax_amount=tax_amount,
                total_amount=total,
            )
            self.session.add(item)

        inv.total_untaxed = total_untaxed
        inv.total_tax = total_tax
        inv.total_amount = total_untaxed + total_tax

        await self.session.commit()
        return await self.get_invoice(inv.id)

    async def post_invoice(self, invoice_id) -> CustomerInvoiceResponse:
        """Transition an invoice from draft to posted.

        At posting time we could (later) create journal entries or lock further edits.
        For now: validate status, set status, persist.
        """
        stmt = select(CustomerInvoice).where(CustomerInvoice.id == invoice_id).options(selectinload(CustomerInvoice.lines))
        inv = (await self.session.execute(stmt)).scalar_one_or_none()
        if not inv:
            raise ValueError("Customer Invoice not found")
        if inv.status and inv.status != 'draft':
            raise ValueError("Only draft invoices can be posted")
        inv.status = 'posted'
        await self.session.commit()
        return await self.get_invoice(inv.id)
