from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from models.models import Payment, VendorBill, CustomerInvoice
from schemas.schemas import PaymentCreate, PaymentResponse, PaymentUpdate


class PaymentService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_payments(self):
        res = await self.session.execute(select(Payment).order_by(Payment.created_at.desc()))
        rows = res.scalars().unique().all()
        return [PaymentResponse.model_validate(p) for p in rows]

    async def get_payment(self, payment_id):
        res = await self.session.execute(select(Payment).where(Payment.id == payment_id))
        p = res.scalar_one_or_none()
        if not p:
            return None
        return PaymentResponse.model_validate(p)

    async def create_payment(self, payload: PaymentCreate) -> PaymentResponse:
        """Create a draft (pending) payment record.

        Business rules:
        - Must reference exactly one source document (vendor bill or customer invoice).
        - Source document must be confirmed/posted (not draft/cancelled).
        - Amount must be > 0 and must not exceed outstanding at time of creation.
        - No financial impact is applied until status becomes 'posted'.
        """
        if payload.vendor_bill_id and payload.customer_invoice_id:
            raise ValueError("Provide either vendor_bill_id OR customer_invoice_id, not both")
        if not payload.vendor_bill_id and not payload.customer_invoice_id:
            raise ValueError("Must reference a vendor bill or a customer invoice")
        if payload.amount is None or float(payload.amount) <= 0:
            raise ValueError("Payment amount must be > 0")

        partner_name = payload.partner_name

        # Validate source & outstanding but do NOT mutate yet.
        if payload.vendor_bill_id:
            vb = (await self.session.execute(select(VendorBill).where(VendorBill.id == payload.vendor_bill_id))).scalar_one_or_none()
            if not vb:
                raise ValueError("Vendor Bill not found")
            if vb.status in ('draft',):
                raise ValueError("Cannot create payment for a draft vendor bill")
            if vb.status in ('cancelled',):
                raise ValueError("Cannot create payment for a cancelled vendor bill")
            paid_total = float(vb.paid_cash or 0) + float(vb.paid_bank or 0)
            outstanding = float(vb.total_amount) - paid_total
            if outstanding <= 0:
                raise ValueError("Vendor bill already fully paid")
            if float(payload.amount) > outstanding + 1e-6:
                raise ValueError("Payment exceeds outstanding amount for vendor bill")
            if vb.vendor_name and not partner_name:
                partner_name = vb.vendor_name
        if payload.customer_invoice_id:
            inv = (await self.session.execute(select(CustomerInvoice).where(CustomerInvoice.id == payload.customer_invoice_id))).scalar_one_or_none()
            if not inv:
                raise ValueError("Customer Invoice not found")
            if inv.status in ('draft',):
                raise ValueError("Cannot create payment for a draft customer invoice")
            if inv.status in ('cancelled',):
                raise ValueError("Cannot create payment for a cancelled customer invoice")
            paid_total = float(inv.amount_paid or 0)
            outstanding = float(inv.total_amount) - paid_total
            if outstanding <= 0:
                raise ValueError("Customer invoice already fully paid")
            if float(payload.amount) > outstanding + 1e-6:
                raise ValueError("Payment exceeds outstanding amount for customer invoice")
            if inv.customer_name and not partner_name:
                partner_name = inv.customer_name

        payment = Payment(
            payment_number=str(uuid4()),
            partner_type=payload.partner_type,
            partner_name=partner_name,
            payment_method=payload.payment_method,
            amount=payload.amount,
            vendor_bill_id=payload.vendor_bill_id,
            customer_invoice_id=payload.customer_invoice_id,
            # status defaults to 'draft'
        )
        self.session.add(payment)
        await self.session.commit()
        await self.session.refresh(payment)
        return PaymentResponse.model_validate(payment)

    async def update_payment(self, payment_id, payload: PaymentUpdate):
        res = await self.session.execute(select(Payment).where(Payment.id == payment_id))
        payment = res.scalar_one_or_none()
        if not payment:
            return None
        original_status = payment.status
        new_status = payload.status or payment.status
        # Only process if status actually changes
        if new_status != original_status:
            # Transition draft -> posted: apply financial impact
            if original_status == 'draft' and new_status == 'posted':
                await self._apply_financial_impact(payment)
                payment.status = 'posted'
            # Transition posted -> cancelled: reverse financial impact
            elif original_status == 'posted' and new_status == 'cancelled':
                await self._reverse_financial_impact(payment)
                payment.status = 'cancelled'
            # Other transitions just set (e.g., draft -> cancelled)
            else:
                payment.status = new_status
        payment.updated_at = datetime.utcnow()
        await self.session.commit()
        await self.session.refresh(payment)
        return PaymentResponse.model_validate(payment)

    async def _apply_financial_impact(self, payment: Payment):
        """Apply amounts to related bill/invoice validating outstanding at apply time."""
        if payment.vendor_bill_id:
            vb = (await self.session.execute(select(VendorBill).where(VendorBill.id == payment.vendor_bill_id))).scalar_one_or_none()
            if not vb:
                raise ValueError("Vendor Bill not found for payment")
            if vb.status in ('draft', 'cancelled'):
                raise ValueError("Cannot post payment for vendor bill in status " + vb.status)
            paid_total = float(vb.paid_cash or 0) + float(vb.paid_bank or 0)
            outstanding = float(vb.total_amount) - paid_total
            if float(payment.amount) > outstanding + 1e-6:
                raise ValueError("Payment exceeds current outstanding for vendor bill")
            if payment.payment_method == 'cash':
                vb.paid_cash = (vb.paid_cash or 0) + payment.amount
            else:
                vb.paid_bank = (vb.paid_bank or 0) + payment.amount
        if payment.customer_invoice_id:
            inv = (await self.session.execute(select(CustomerInvoice).where(CustomerInvoice.id == payment.customer_invoice_id))).scalar_one_or_none()
            if not inv:
                raise ValueError("Customer Invoice not found for payment")
            if inv.status in ('draft', 'cancelled'):
                raise ValueError("Cannot post payment for customer invoice in status " + inv.status)
            outstanding = float(inv.total_amount) - float(inv.amount_paid or 0)
            if float(payment.amount) > outstanding + 1e-6:
                raise ValueError("Payment exceeds current outstanding for customer invoice")
            inv.amount_paid = (inv.amount_paid or 0) + payment.amount
            if float(inv.amount_paid) >= float(inv.total_amount):
                inv.status = 'paid'

    async def _reverse_financial_impact(self, payment: Payment):
        """Reverse previously applied impact when a posted payment is cancelled."""
        if payment.vendor_bill_id:
            vb = (await self.session.execute(select(VendorBill).where(VendorBill.id == payment.vendor_bill_id))).scalar_one_or_none()
            if vb:
                if payment.payment_method == 'cash':
                    vb.paid_cash = max(0, (vb.paid_cash or 0) - float(payment.amount))
                else:
                    vb.paid_bank = max(0, (vb.paid_bank or 0) - float(payment.amount))
        if payment.customer_invoice_id:
            inv = (await self.session.execute(select(CustomerInvoice).where(CustomerInvoice.id == payment.customer_invoice_id))).scalar_one_or_none()
            if inv:
                inv.amount_paid = max(0, (inv.amount_paid or 0) - float(payment.amount))
                # If it was marked paid and now outstanding, revert to posted
                if float(inv.amount_paid) < float(inv.total_amount) and inv.status == 'paid':
                    inv.status = 'posted'
