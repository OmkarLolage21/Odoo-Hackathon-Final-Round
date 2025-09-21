from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from typing import List

# User schemas

class ContactBase(BaseModel):
    name: str
    type: str  # 'customer', 'vendor', or 'both'
    email: EmailStr | None = None
    mobile: str | None = None
    address_city: str | None = None
    address_state: str | None = None
    address_pincode: str | None = None

class ContactCreate(ContactBase):
    pass

class ContactUpdate(ContactBase):
    pass

class ContactResponse(ContactBase):
    id: UUID
    user_id: UUID | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Product schemas

class ProductBase(BaseModel):
    name: str = Field(..., max_length=255)
    type: str = Field(..., pattern="^(goods|service)$")
    sales_price: float
    purchase_price: float
    hsn_code: Optional[str] = Field(default=None, max_length=50)
    category: Optional[str] = Field(default=None, max_length=100)
    current_stock: int = 0
    tax_name: Optional[str] = Field(default=None, max_length=100)


class ProductCreate(ProductBase):
    pass


class Product(ProductBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    # Computed (not necessarily stored) tax percentages derived from tax_name lookup
    sales_tax_percent: float | None = None
    purchase_tax_percent: float | None = None

    class Config:
        from_attributes = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(default=None, max_length=255)
    type: Optional[str] = Field(default=None, pattern="^(goods|service)$")
    sales_price: Optional[float] = None
    purchase_price: Optional[float] = None
    hsn_code: Optional[str] = Field(default=None, max_length=50)
    category: Optional[str] = Field(default=None, max_length=100)
    current_stock: Optional[int] = None
    tax_name: Optional[str] = Field(default=None, max_length=100)


class HSNItem(BaseModel):
    c: str
    n: str


class HSNResponse(BaseModel):
    data: list[HSNItem]


# =============================
# Sales Order Schemas
# =============================

class SalesOrderLineBase(BaseModel):
    product_name: str  # kept for display
    quantity: int
    unit_price: float
    product_id: UUID | None = None  # new optional explicit product reference


class SalesOrderLineCreate(SalesOrderLineBase):
    product_id: UUID | None = None


class SalesOrderLineResponse(SalesOrderLineBase):
    id: UUID
    product_id: UUID
    tax_percent: float
    untaxed_amount: float
    tax_amount: float
    total_amount: float

    class Config:
        from_attributes = True


class SalesOrderBase(BaseModel):
    status: str | None = None  # defaults to draft server-side


class SalesOrderCreate(SalesOrderBase):
    lines: list[SalesOrderLineCreate]

class SalesOrderUpdate(SalesOrderBase):
    # Optional replacement of all lines; if provided, existing lines are replaced
    lines: list[SalesOrderLineCreate] | None = None


class SalesOrderResponse(SalesOrderBase):
    id: UUID
    so_number: str
    total_untaxed: float
    total_tax: float
    total_amount: float
    created_at: datetime
    updated_at: datetime
    lines: list[SalesOrderLineResponse] = []

    class Config:
        from_attributes = True


# =============================
# Purchase Order Schemas
# =============================

class PurchaseOrderLineBase(BaseModel):
    product_name: str
    quantity: int
    unit_price: float
    product_id: UUID | None = None


class PurchaseOrderLineCreate(PurchaseOrderLineBase):
    product_id: UUID | None = None


class PurchaseOrderLineResponse(PurchaseOrderLineBase):
    id: UUID
    product_id: UUID
    tax_percent: float
    untaxed_amount: float
    tax_amount: float
    total_amount: float

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    status: str | None = None
    vendor_name: str | None = None


class PurchaseOrderCreate(PurchaseOrderBase):
    lines: list[PurchaseOrderLineCreate]

class PurchaseOrderUpdate(PurchaseOrderBase):
    lines: list[PurchaseOrderLineCreate] | None = None


class PurchaseOrderResponse(PurchaseOrderBase):
    id: UUID
    po_number: str
    vendor_name: str | None = None
    total_untaxed: float
    total_tax: float
    total_amount: float
    created_at: datetime
    updated_at: datetime
    lines: list[PurchaseOrderLineResponse] = []

    class Config:
        from_attributes = True


# =============================
# Vendor Bill Schemas
# =============================

class VendorBillLineBase(BaseModel):
    product_name: str
    quantity: int
    unit_price: float
    product_id: UUID | None = None


class VendorBillLineCreate(VendorBillLineBase):
    product_id: UUID | None = None
    account_name: str | None = None


class VendorBillLineResponse(VendorBillLineBase):
    id: UUID
    product_id: UUID
    hsn_code: str | None = None
    account_name: str | None = None
    tax_percent: float
    untaxed_amount: float
    tax_amount: float
    total_amount: float

    class Config:
        from_attributes = True


class VendorBillBase(BaseModel):
    status: str | None = None
    vendor_name: str | None = None
    bill_reference: str | None = None
    bill_date: datetime | None = None
    due_date: datetime | None = None
    purchase_order_id: UUID | None = None


class VendorBillCreate(VendorBillBase):
    lines: List[VendorBillLineCreate]


class VendorBillUpdate(VendorBillBase):
    lines: List[VendorBillLineCreate] | None = None


class VendorBillResponse(VendorBillBase):
    id: UUID
    bill_number: str
    total_untaxed: float
    total_tax: float
    total_amount: float
    paid_cash: float
    paid_bank: float
    created_at: datetime
    updated_at: datetime
    lines: List[VendorBillLineResponse] = []

    class Config:
        from_attributes = True


# =============================
# Customer Invoice Schemas
# =============================

class CustomerInvoiceLineBase(BaseModel):
    product_name: str
    quantity: int
    unit_price: float
    product_id: UUID | None = None
    account_id: UUID | None = None


class CustomerInvoiceLineCreate(CustomerInvoiceLineBase):
    product_id: UUID | None = None
    account_id: UUID | None = None


class CustomerInvoiceLineResponse(CustomerInvoiceLineBase):
    id: UUID
    product_id: UUID
    hsn_code: str | None = None
    tax_percent: float
    untaxed_amount: float
    tax_amount: float
    total_amount: float

    class Config:
        from_attributes = True


class CustomerInvoiceBase(BaseModel):
    status: str | None = None
    customer_id: UUID | None = None
    customer_name: str | None = None
    invoice_date: datetime | None = None
    due_date: datetime | None = None


class CustomerInvoiceCreate(CustomerInvoiceBase):
    lines: List[CustomerInvoiceLineCreate]


class CustomerInvoiceResponse(CustomerInvoiceBase):
    id: UUID
    invoice_number: str
    total_untaxed: float
    total_tax: float
    total_amount: float
    amount_paid: float
    created_at: datetime
    updated_at: datetime
    lines: List[CustomerInvoiceLineResponse] = []

    class Config:
        from_attributes = True


# =============================
# Payments & Journal Entries
# =============================

class PaymentBase(BaseModel):
    payment_direction: str  # 'send' | 'receive'
    partner_id: UUID
    payment_date: datetime
    amount: float
    journal_id: UUID
    contra_account_id: UUID  # Debtors/Creditor account depending on direction
    note: str | None = None
    customer_invoice_id: UUID | None = None  # optional link when paying invoice


class PaymentCreate(PaymentBase):
    pass


class PaymentResponse(PaymentBase):
    id: UUID
    payment_number: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class JournalEntryResponse(BaseModel):
    id: UUID
    transaction_id: UUID
    entry_date: datetime
    account_id: UUID
    partner_id: UUID | None = None
    debit_amount: float
    credit_amount: float
    description: str | None = None
    customer_invoice_id: UUID | None = None
    payment_id: UUID | None = None
    created_at: datetime

    class Config:
        from_attributes = True
