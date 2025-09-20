from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.models import Product, PurchaseOrder, PurchaseOrderLine, Tax
from schemas.schemas import PurchaseOrderCreate, PurchaseOrderResponse, PurchaseOrderUpdate

class PurchaseOrderService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_orders(self):
        stmt = select(PurchaseOrder).order_by(PurchaseOrder.created_at.desc())
        result = (await self.session.execute(stmt)).scalars().unique().all()
        return [PurchaseOrderResponse.model_validate(o) for o in result]

    async def get_order(self, order_id):
        stmt = select(PurchaseOrder).where(PurchaseOrder.id == order_id)
        order = (await self.session.execute(stmt)).scalar_one_or_none()
        if not order:
            return None
        return PurchaseOrderResponse.model_validate(order)

    async def create_order(self, payload: PurchaseOrderCreate) -> PurchaseOrderResponse:
        po_number = str(uuid4())
        order = PurchaseOrder(po_number=po_number, vendor_name=payload.vendor_name)
        self.session.add(order)
        await self.session.flush()

        total_untaxed = 0.0
        total_tax = 0.0

        for line_in in payload.lines:
            product = None
            if getattr(line_in, 'product_id', None):
                stmt = select(Product).where(Product.id == line_in.product_id)
                product = (await self.session.execute(stmt)).scalar_one_or_none()
            if not product:
                stmt = select(Product).where(Product.name == line_in.product_name)
                product = (await self.session.execute(stmt)).scalar_one_or_none()
            if not product:
                raise ValueError(f"Product '{line_in.product_name}' not found")

            tax_percent = 0.0
            if product.tax_name:
                tax_stmt = select(Tax).where(
                    Tax.name == product.tax_name,
                    Tax.is_applicable_on_purchase == True
                )
                tax_row = (await self.session.execute(tax_stmt)).scalar_one_or_none()
                if tax_row and tax_row.computation_method == 'percentage':
                    tax_percent = float(tax_row.value)

            untaxed = line_in.quantity * line_in.unit_price
            tax_amount = round(float(untaxed) * (tax_percent / 100), 2)
            total = untaxed + tax_amount

            total_untaxed += untaxed
            total_tax += tax_amount

            line = PurchaseOrderLine(
                purchase_order_id=order.id,
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
        return PurchaseOrderResponse.model_validate(order)

    async def update_order(self, order_id, payload: PurchaseOrderUpdate):
        stmt = select(PurchaseOrder).where(PurchaseOrder.id == order_id)
        order = (await self.session.execute(stmt)).scalar_one_or_none()
        if not order:
            return None

        if payload.status:
            order.status = payload.status
        if payload.vendor_name is not None:
            order.vendor_name = payload.vendor_name

        if payload.lines is not None:
            existing_lines_stmt = select(PurchaseOrderLine).where(PurchaseOrderLine.purchase_order_id == order.id)
            existing_lines = (await self.session.execute(existing_lines_stmt)).scalars().all()
            for l in existing_lines:
                await self.session.delete(l)

            total_untaxed = 0.0
            total_tax = 0.0
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
                        Tax.is_applicable_on_purchase == True
                    )
                    tax_row = (await self.session.execute(tax_stmt)).scalar_one_or_none()
                    if tax_row and tax_row.computation_method == 'percentage':
                        tax_percent = float(tax_row.value)

                untaxed = line_in.quantity * line_in.unit_price
                tax_amount = round(float(untaxed) * (tax_percent / 100), 2)
                total = untaxed + tax_amount

                total_untaxed += untaxed
                total_tax += tax_amount

                new_line = PurchaseOrderLine(
                    purchase_order_id=order.id,
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
        return PurchaseOrderResponse.model_validate(order)

    async def delete_order(self, order_id):
        stmt = select(PurchaseOrder).where(PurchaseOrder.id == order_id)
        order = (await self.session.execute(stmt)).scalar_one_or_none()
        if not order:
            return False
        await self.session.delete(order)
        await self.session.commit()
        return True
