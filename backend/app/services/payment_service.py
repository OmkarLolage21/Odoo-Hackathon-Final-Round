from uuid import uuid4, UUID
from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from models.models import Payment, JournalEntry, ChartOfAccount
from schemas.schemas import PaymentCreate, PaymentResponse, JournalEntryResponse

class PaymentService:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def list_payments(self):
        stmt = select(Payment).order_by(Payment.created_at.desc())
        rows = (await self.session.execute(stmt)).scalars().all()
        return [PaymentResponse.model_validate(p) for p in rows]

    async def create_payment(self, payload: PaymentCreate):
        # Generate payment number using uuid for now (can change to PAY/YYYY/NNNN)
        payment_number = str(uuid4())

        # Validate journal account exists
        res = await self.session.execute(select(ChartOfAccount).where(ChartOfAccount.id == payload.journal_id))
        if not res.scalar_one_or_none():
            raise ValueError("Journal (bank/cash) account not found")

        res2 = await self.session.execute(select(ChartOfAccount).where(ChartOfAccount.id == payload.contra_account_id))
        if not res2.scalar_one_or_none():
            raise ValueError("Contra (debtors/creditors) account not found")

        payment = Payment(
            payment_number=payment_number,
            payment_direction=payload.payment_direction,
            partner_id=payload.partner_id,
            payment_date=payload.payment_date or date.today(),
            amount=payload.amount,
            journal_id=payload.journal_id,
            note=payload.note,
        )
        self.session.add(payment)
        await self.session.flush()

        txn_id = uuid4()
        # Create double-entry journal rows depending on direction
        if payload.payment_direction == 'send':
            # Vendor payment: Debit Creditor (contra), Credit Bank (journal)
            debit = JournalEntry(
                transaction_id=txn_id,
                entry_date=payload.payment_date or date.today(),
                account_id=payload.contra_account_id,
                partner_id=payload.partner_id,
                debit_amount=payload.amount,
                credit_amount=0,
                description=payload.note,
                payment_id=payment.id,
            )
            credit = JournalEntry(
                transaction_id=txn_id,
                entry_date=payload.payment_date or date.today(),
                account_id=payload.journal_id,
                partner_id=None,
                debit_amount=0,
                credit_amount=payload.amount,
                description=payload.note,
                payment_id=payment.id,
            )
            # For 'send', the counter account must be Creditor A/c; require client to pass it via note? Better to leave description and rely on COA relation.
        else:
            # Customer payment (receive): Debit Bank (journal), Credit Debtors (contra)
            debit = JournalEntry(
                transaction_id=txn_id,
                entry_date=payload.payment_date or date.today(),
                account_id=payload.journal_id,
                partner_id=None,
                debit_amount=payload.amount,
                credit_amount=0,
                description=payload.note,
                customer_invoice_id=payload.customer_invoice_id,
                payment_id=payment.id,
            )
            credit = JournalEntry(
                transaction_id=txn_id,
                entry_date=payload.payment_date or date.today(),
                account_id=payload.contra_account_id,
                partner_id=payload.partner_id,
                debit_amount=0,
                credit_amount=payload.amount,
                description=payload.note,
                customer_invoice_id=payload.customer_invoice_id,
                payment_id=payment.id,
            )

        # The actual accounts for creditor/debtors should come from COA. For now, rely on journal_id for the bank/cash, and require client to pass target contra account via note is not ideal.
        # Instead, we derive them by convention names if present. This is a simplified placeholder; adapt to your COA ids externally when calling.
        # Save entries
        self.session.add_all([debit, credit])
        await self.session.commit()
        await self.session.refresh(payment)
        return PaymentResponse.model_validate(payment)
