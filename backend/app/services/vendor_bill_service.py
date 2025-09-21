from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import date

from models.models import (
    Product,
    Tax,
    ChartOfAccount,
    VendorBill,
    VendorBillLine,
    PurchaseOrder,
    PurchaseOrderLine,
)
from schemas.schemas import VendorBillCreate, VendorBillResponse, VendorBillUpdate


DEFAULT_PURCHASE_ACCOUNT_NAME = "Purchase Expense A/c"


class VendorBillService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_bills(self):
        res = await self.session.execute(select(VendorBill).order_by(VendorBill.created_at.desc()))
        bills = res.scalars().unique().all()
        return [VendorBillResponse.model_validate(b) for b in bills]

    async def get_bill(self, bill_id):
        res = await self.session.execute(select(VendorBill).where(VendorBill.id == bill_id))
        bill = res.scalar_one_or_none()
        if not bill:
            return None
        return VendorBillResponse.model_validate(bill)

    async def create_bill(self, payload: VendorBillCreate) -> VendorBillResponse:
        bill_number = str(uuid4())
        bill = VendorBill(
            bill_number=bill_number,
            vendor_name=payload.vendor_name,
            bill_reference=payload.bill_reference,
            bill_date=(payload.bill_date.date() if hasattr(payload.bill_date, 'date') else payload.bill_date) if payload.bill_date else None,
            due_date=(payload.due_date.date() if hasattr(payload.due_date, 'date') else payload.due_date) if payload.due_date else None,
            purchase_order_id=payload.purchase_order_id,
        )
        self.session.add(bill)
        await self.session.flush()

        total_untaxed = 0.0
        total_tax = 0.0

        # Try fetch default COA account once
        coa_name_default = await self._get_default_purchase_account_name()

        for line_in in payload.lines:
            product = None
            if getattr(line_in, 'product_id', None):
                res_p = await self.session.execute(select(Product).where(Product.id == line_in.product_id))
                product = res_p.scalar_one_or_none()
            if not product:
                res_p = await self.session.execute(select(Product).where(Product.name == line_in.product_name))
                product = res_p.scalar_one_or_none()
            if not product:
                raise ValueError(f"Product '{line_in.product_name}' not found")

            # Tax percent from tax_name, purchase side
            tax_percent = 0.0
            if product.tax_name:
                res_t = await self.session.execute(select(Tax).where(
                    Tax.name == product.tax_name,
                    Tax.is_applicable_on_purchase == True
                ))
                tax_row = res_t.scalar_one_or_none()
                if tax_row and getattr(tax_row, 'computation_method', 'percentage') == 'percentage':
                    tax_percent = float(getattr(tax_row, 'value', 0) or 0)

            untaxed = float(line_in.quantity) * float(line_in.unit_price)
            tax_amount = round(untaxed * (tax_percent / 100), 2)
            total = untaxed + tax_amount

            total_untaxed += untaxed
            total_tax += tax_amount

            vb_line = VendorBillLine(
                vendor_bill_id=bill.id,
                product_id=product.id,
                product_name=product.name,
                hsn_code=getattr(product, 'hsn_code', None),
                account_name=getattr(line_in, 'account_name', None) or coa_name_default,
                quantity=line_in.quantity,
                unit_price=line_in.unit_price,
                tax_percent=tax_percent,
                untaxed_amount=untaxed,
                tax_amount=tax_amount,
                total_amount=total,
            )
            self.session.add(vb_line)

        bill.total_untaxed = total_untaxed
        bill.total_tax = total_tax
        bill.total_amount = total_untaxed + total_tax

        await self.session.commit()
        await self.session.refresh(bill)
        return VendorBillResponse.model_validate(bill)

    async def update_bill(self, bill_id, payload: VendorBillUpdate):
        res = await self.session.execute(select(VendorBill).where(VendorBill.id == bill_id))
        bill = res.scalar_one_or_none()
        if not bill:
            return None

        if payload.status:
            bill.status = payload.status
        if payload.vendor_name is not None:
            bill.vendor_name = payload.vendor_name
        if payload.bill_reference is not None:
            bill.bill_reference = payload.bill_reference
        if payload.bill_date is not None:
            bill.bill_date = payload.bill_date.date() if hasattr(payload.bill_date, 'date') else payload.bill_date
        if payload.due_date is not None:
            bill.due_date = payload.due_date.date() if hasattr(payload.due_date, 'date') else payload.due_date
        if payload.purchase_order_id is not None:
            bill.purchase_order_id = payload.purchase_order_id

        if payload.lines is not None:
            # replace
            existing = (await self.session.execute(select(VendorBillLine).where(VendorBillLine.vendor_bill_id == bill.id))).scalars().all()
            for l in existing:
                await self.session.delete(l)

            total_untaxed = 0.0
            total_tax = 0.0
            coa_name_default = await self._get_default_purchase_account_name()

            for line_in in payload.lines:
                product = None
                if getattr(line_in, 'product_id', None):
                    res_p = await self.session.execute(select(Product).where(Product.id == line_in.product_id))
                    product = res_p.scalar_one_or_none()
                if not product:
                    res_p = await self.session.execute(select(Product).where(Product.name == line_in.product_name))
                    product = res_p.scalar_one_or_none()
                if not product:
                    raise ValueError(f"Product '{line_in.product_name}' not found")

                tax_percent = 0.0
                if product.tax_name:
                    res_t = await self.session.execute(select(Tax).where(
                        Tax.name == product.tax_name,
                        Tax.is_applicable_on_purchase == True
                    ))
                    tax_row = res_t.scalar_one_or_none()
                    if tax_row and getattr(tax_row, 'computation_method', 'percentage') == 'percentage':
                        tax_percent = float(getattr(tax_row, 'value', 0) or 0)

                untaxed = float(line_in.quantity) * float(line_in.unit_price)
                tax_amount = round(untaxed * (tax_percent / 100), 2)
                total = untaxed + tax_amount

                total_untaxed += untaxed
                total_tax += tax_amount

                new_line = VendorBillLine(
                    vendor_bill_id=bill.id,
                    product_id=product.id,
                    product_name=product.name,
                    hsn_code=getattr(product, 'hsn_code', None),
                    account_name=getattr(line_in, 'account_name', None) or coa_name_default,
                    quantity=line_in.quantity,
                    unit_price=line_in.unit_price,
                    tax_percent=tax_percent,
                    untaxed_amount=untaxed,
                    tax_amount=tax_amount,
                    total_amount=total,
                )
                self.session.add(new_line)

            bill.total_untaxed = total_untaxed
            bill.total_tax = total_tax
            bill.total_amount = total_untaxed + total_tax

        await self.session.commit()
        await self.session.refresh(bill)
        return VendorBillResponse.model_validate(bill)

    async def _get_default_purchase_account_name(self) -> str:
        # Ideally pick a specific expense account; fallback to constant if not found.
        res = await self.session.execute(
            select(ChartOfAccount).where(ChartOfAccount.type == 'expense').limit(1)
        )
        row = res.scalar_one_or_none()
        return row.name if row else DEFAULT_PURCHASE_ACCOUNT_NAME

    async def create_bill_from_purchase_order(self, purchase_order_id) -> VendorBillResponse:
        """Generate a vendor bill directly from a confirmed purchase order.

        Rules:
        - Purchase order must exist and be in status 'confirmed'.
        - Copies each PO line into vendor bill lines with tax recomputed (in case tax config changed) and adds hsn_code/account_name.
        - Sets vendor_name from PO.
        - Bill number auto generated.
        """
        po = (await self.session.execute(select(PurchaseOrder).where(PurchaseOrder.id == purchase_order_id))).scalar_one_or_none()
        if not po:
            raise ValueError("Purchase Order not found")
        if po.status != 'confirmed':
            raise ValueError("Purchase Order must be confirmed before creating a bill")

        bill_number = str(uuid4())
        bill = VendorBill(
            bill_number=bill_number,
            vendor_name=po.vendor_name,
            purchase_order_id=po.id,
            status='draft',
        )
        self.session.add(bill)
        await self.session.flush()

        total_untaxed = 0.0
        total_tax = 0.0
        coa_name_default = await self._get_default_purchase_account_name()

        # fetch lines separate to ensure fresh state (use relationship or query)
        po_lines = (await self.session.execute(select(PurchaseOrderLine).where(PurchaseOrderLine.purchase_order_id == po.id))).scalars().all()
        for po_line in po_lines:
            # ensure product details for hsn_code & tax updates
            product = (await self.session.execute(select(Product).where(Product.id == po_line.product_id))).scalar_one_or_none()
            if not product:
                # skip line gracefully (could also raise)
                continue
            tax_percent = 0.0
            if product.tax_name:
                res_t = await self.session.execute(select(Tax).where(
                    Tax.name == product.tax_name,
                    Tax.is_applicable_on_purchase == True
                ))
                tax_row = res_t.scalar_one_or_none()
                if tax_row and getattr(tax_row, 'computation_method', 'percentage') == 'percentage':
                    tax_percent = float(getattr(tax_row, 'value', 0) or 0)

            untaxed = float(po_line.quantity) * float(po_line.unit_price)
            tax_amount = round(untaxed * (tax_percent / 100), 2)
            total = untaxed + tax_amount

            total_untaxed += untaxed
            total_tax += tax_amount

            vb_line = VendorBillLine(
                vendor_bill_id=bill.id,
                product_id=product.id,
                product_name=product.name,
                hsn_code=getattr(product, 'hsn_code', None),
                account_name=coa_name_default,
                quantity=po_line.quantity,
                unit_price=po_line.unit_price,
                tax_percent=tax_percent,
                untaxed_amount=untaxed,
                tax_amount=tax_amount,
                total_amount=total,
            )
            self.session.add(vb_line)

        bill.total_untaxed = total_untaxed
        bill.total_tax = total_tax
        bill.total_amount = total_untaxed + total_tax

        await self.session.commit()
        await self.session.refresh(bill)
        return VendorBillResponse.model_validate(bill)
