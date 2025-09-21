from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.models import Product, SalesOrder, SalesOrderLine, Tax, Contact
from schemas.schemas import SalesOrderCreate, SalesOrderResponse, SalesOrderUpdate


class SalesOrderService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_orders(self):
        stmt = select(SalesOrder).order_by(SalesOrder.created_at.desc())
        result = (await self.session.execute(stmt)).scalars().unique().all()
        # Ensure lines are loaded (relationship is selectin, so already fetched)
        return [SalesOrderResponse.model_validate(o) for o in result]

    async def get_order(self, order_id):
        stmt = select(SalesOrder).where(SalesOrder.id == order_id)
        order = (await self.session.execute(stmt)).scalar_one_or_none()
        if not order:
            return None
        return SalesOrderResponse.model_validate(order)

    async def create_order(self, payload: SalesOrderCreate) -> SalesOrderResponse:
        # Generate SO number using uuid (could be improved to sequential later)
        so_number = str(uuid4())
        customer_name = payload.customer_name
        if payload.customer_id and not customer_name:
            contact = (await self.session.execute(select(Contact).where(Contact.id == payload.customer_id))).scalar_one_or_none()
            if contact:
                customer_name = contact.name

        order = SalesOrder(so_number=so_number, customer_id=payload.customer_id, customer_name=customer_name)
        self.session.add(order)
        await self.session.flush()  # get order id

        total_untaxed = 0
        total_tax = 0

        for line_in in payload.lines:
            # Prefer product_id for lookup if supplied, otherwise fallback to name
            product = None
            if getattr(line_in, 'product_id', None):
                stmt = select(Product).where(Product.id == line_in.product_id)
                product = (await self.session.execute(stmt)).scalar_one_or_none()
            if not product:
                stmt = select(Product).where(Product.name == line_in.product_name)
                product = (await self.session.execute(stmt)).scalar_one_or_none()
            if not product:
                raise ValueError(f"Product '{line_in.product_name}' not found")

            # Derive tax percent by looking up the tax record referenced by product.tax_name
            tax_percent = 0.0
            if product.tax_name:
                tax_stmt = select(Tax).where(
                    Tax.name == product.tax_name,
                    Tax.is_applicable_on_sales == True
                )
                tax_row = (await self.session.execute(tax_stmt)).scalar_one_or_none()
                if tax_row and tax_row.computation_method == 'percentage':
                    tax_percent = float(tax_row.value)

            # Untaxed amount = qty * unit price
            untaxed = line_in.quantity * line_in.unit_price
            tax_amount = round(float(untaxed) * (tax_percent / 100), 2)
            total = untaxed + tax_amount

            total_untaxed += untaxed
            total_tax += tax_amount

            line = SalesOrderLine(
                sales_order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                quantity=line_in.quantity,
                unit_price=line_in.unit_price,
                tax_percent=tax_percent,
                untaxed_amount=untaxed,
                tax_amount=tax_amount,
                total_amount=total,
            )
            self.session.add(line)

        order.total_untaxed = total_untaxed
        order.total_tax = total_tax
        order.total_amount = total_untaxed + total_tax

        await self.session.commit()
        await self.session.refresh(order)
        return SalesOrderResponse.model_validate(order)

    async def update_order(self, order_id, payload: SalesOrderUpdate):
        stmt = select(SalesOrder).where(SalesOrder.id == order_id)
        order = (await self.session.execute(stmt)).scalar_one_or_none()
        if not order:
            return None

        # Update status if provided
        if payload.status:
            order.status = payload.status

        # Update customer info
        if getattr(payload, 'customer_id', None) is not None:
            order.customer_id = payload.customer_id
            if payload.customer_id:
                contact = (await self.session.execute(select(Contact).where(Contact.id == payload.customer_id))).scalar_one_or_none()
                if contact:
                    order.customer_name = contact.name
        if getattr(payload, 'customer_name', None) is not None:
            # Allow overriding customer_name manually if provided
            order.customer_name = payload.customer_name

        # If lines provided, replace all existing lines
        if payload.lines is not None:
            # delete existing lines
            existing_lines_stmt = select(SalesOrderLine).where(SalesOrderLine.sales_order_id == order.id)
            existing_lines = (await self.session.execute(existing_lines_stmt)).scalars().all()
            for l in existing_lines:
                await self.session.delete(l)

            total_untaxed = 0
            total_tax = 0
            for line_in in payload.lines:
                product = None
                if getattr(line_in, 'product_id', None):
                    stmt_prod = select(Product).where(Product.id == line_in.product_id)
                    product = (await self.session.execute(stmt_prod)).scalar_one_or_none()
                if not product:
                    stmt_prod = select(Product).where(Product.name == line_in.product_name)
                    product = (await self.session.execute(stmt_prod)).scalar_one_or_none()
                if not product:
                    raise ValueError(f"Product '{line_in.product_name}' not found")

                tax_percent = 0.0
                if product.tax_name:
                    tax_stmt = select(Tax).where(
                        Tax.name == product.tax_name,
                        Tax.is_applicable_on_sales == True
                    )
                    tax_row = (await self.session.execute(tax_stmt)).scalar_one_or_none()
                    if tax_row and tax_row.computation_method == 'percentage':
                        tax_percent = float(tax_row.value)

                untaxed = line_in.quantity * line_in.unit_price
                tax_amount = round(float(untaxed) * (tax_percent / 100), 2)
                total = untaxed + tax_amount

                total_untaxed += untaxed
                total_tax += tax_amount

                new_line = SalesOrderLine(
                    sales_order_id=order.id,
                    product_id=product.id,
                    product_name=product.name,
                    quantity=line_in.quantity,
                    unit_price=line_in.unit_price,
                    tax_percent=tax_percent,
                    untaxed_amount=untaxed,
                    tax_amount=tax_amount,
                    total_amount=total,
                )
                self.session.add(new_line)

            order.total_untaxed = total_untaxed
            order.total_tax = total_tax
            order.total_amount = total_untaxed + total_tax

        await self.session.commit()
        await self.session.refresh(order)
        return SalesOrderResponse.model_validate(order)

    async def delete_order(self, order_id):
        stmt = select(SalesOrder).where(SalesOrder.id == order_id)
        order = (await self.session.execute(stmt)).scalar_one_or_none()
        if not order:
            return False
        await self.session.delete(order)
        await self.session.commit()
        return True