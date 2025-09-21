from datetime import datetime
from uuid import UUID
import enum
from sqlalchemy import Enum, String, ForeignKey, Numeric, Boolean, Integer
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.sql import func
from sqlalchemy import Date

from core.database import Base

class Tax(Base):
    __tablename__ = "taxes"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    computation_method: Mapped[str] = mapped_column(Enum('percentage', 'fixed', name='computation_method_enum'), nullable=False)
    value: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    is_applicable_on_sales: Mapped[bool] = mapped_column(Boolean, server_default='true')
    is_applicable_on_purchase: Mapped[bool] = mapped_column(Boolean, server_default='true')
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

# Contact models

class Contact(Base):
    __tablename__ = "contacts"
    
    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(Enum('customer', 'vendor', 'both', name='contact_type'), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=True)
    mobile: Mapped[str] = mapped_column(String(20), nullable=True)
    address_city: Mapped[str] = mapped_column(String(100), nullable=True)
    address_state: Mapped[str] = mapped_column(String(100), nullable=True)
    address_pincode: Mapped[str] = mapped_column(String(10), nullable=True)
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), unique=True, nullable=True)
    user = relationship("User", back_populates="contact")
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


class ChartOfAccount(Base):
    __tablename__ = "chart_of_accounts"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    # Map to existing DB column names
    name: Mapped[str] = mapped_column("account_name", String(255), nullable=False)
    type: Mapped[str] = mapped_column(
        "account_type",
        Enum('asset', 'liability', 'income', 'expense', 'equity', name='account_type'),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default='true')
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

# Product models

class ProductType(str, enum.Enum):
    GOODS = "goods"
    SERVICE = "service"


class Product(Base):
    __tablename__ = "products"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    # DB enum name 'product_type' to match requested type
    type: Mapped[str] = mapped_column(Enum('goods', 'service', name='product_type'), nullable=False)

    sales_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    purchase_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    hsn_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    current_stock: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    tax_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())


# ==========================
# Sales Order models
# ==========================

class SalesOrderStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class SalesOrder(Base):
    __tablename__ = "sales_orders"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    # business-visible number (uuid string for now per requirement)
    so_number: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    customer_id: Mapped[UUID | None] = mapped_column(ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum('draft', 'confirmed', 'cancelled', name='sales_order_status'),
        nullable=False, server_default='draft'
    )
    total_untaxed: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    total_tax: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    lines: Mapped[list["SalesOrderLine"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy='selectin'
    )


class SalesOrderLine(Base):
    __tablename__ = "sales_order_lines"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    sales_order_id: Mapped[UUID] = mapped_column(ForeignKey("sales_orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    untaxed_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    order: Mapped[SalesOrder] = relationship(back_populates="lines")


# ==========================
# Purchase Order models
# ==========================

class PurchaseOrderStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    po_number: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum('draft', 'confirmed', 'cancelled', name='purchase_order_status'),
        nullable=False, server_default='draft'
    )
    total_untaxed: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    total_tax: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    lines: Mapped[list["PurchaseOrderLine"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", lazy='selectin'
    )


class PurchaseOrderLine(Base):
    __tablename__ = "purchase_order_lines"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    purchase_order_id: Mapped[UUID] = mapped_column(ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    untaxed_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    order: Mapped[PurchaseOrder] = relationship(back_populates="lines")


# ==========================
# Vendor Bill models
# ==========================

class VendorBillStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"  # aka posted/confirmed in UI
    CANCELLED = "cancelled"


class VendorBill(Base):
    __tablename__ = "vendor_bills"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    bill_number: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    vendor_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bill_reference: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bill_date: Mapped[datetime | None] = mapped_column(Date(), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(Date(), nullable=True)
    purchase_order_id: Mapped[UUID | None] = mapped_column(ForeignKey("purchase_orders.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum('draft', 'confirmed', 'cancelled', name='vendor_bill_status'),
        nullable=False, server_default='draft'
    )

    total_untaxed: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    total_tax: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')

    paid_cash: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    paid_bank: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    lines: Mapped[list["VendorBillLine"]] = relationship(
        back_populates="bill", cascade="all, delete-orphan", lazy='selectin'
    )


class VendorBillLine(Base):
    __tablename__ = "vendor_bill_lines"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    vendor_bill_id: Mapped[UUID] = mapped_column(ForeignKey("vendor_bills.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hsn_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    account_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    untaxed_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    bill: Mapped[VendorBill] = relationship(back_populates="lines")


# ==========================
# Customer Invoice models
# ==========================

class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    POSTED = "posted"
    PAID = "paid"
    CANCELLED = "cancelled"


class CustomerInvoice(Base):
    __tablename__ = "customer_invoices"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    invoice_number: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    customer_id: Mapped[UUID | None] = mapped_column(ForeignKey("contacts.id", ondelete="SET NULL"), nullable=True)
    customer_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    invoice_date: Mapped[datetime | None] = mapped_column(Date(), nullable=True)
    due_date: Mapped[datetime | None] = mapped_column(Date(), nullable=True)
    status: Mapped[str] = mapped_column(
        Enum('draft', 'posted', 'paid', 'cancelled', name='invoice_status'),
        nullable=False, server_default='draft'
    )

    total_untaxed: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    total_tax: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    amount_paid: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')

    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

    lines: Mapped[list["CustomerInvoiceItem"]] = relationship(
        back_populates="invoice", cascade="all, delete-orphan", lazy='selectin'
    )


class CustomerInvoiceItem(Base):
    __tablename__ = "customer_invoice_items"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    customer_invoice_id: Mapped[UUID] = mapped_column(ForeignKey("customer_invoices.id", ondelete="CASCADE"), nullable=False)
    product_id: Mapped[UUID] = mapped_column(ForeignKey("products.id", ondelete="RESTRICT"), nullable=False)
    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hsn_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    account_id: Mapped[UUID | None] = mapped_column(ForeignKey("chart_of_accounts.id", ondelete="SET NULL"), nullable=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    tax_percent: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    untaxed_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    tax_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    total_amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    invoice: Mapped[CustomerInvoice] = relationship(back_populates="lines")


# ==========================
# Payments models
# ==========================

class PaymentStatus(str, enum.Enum):
    DRAFT = "draft"
    POSTED = "posted"
    CANCELLED = "cancelled"


class PartnerType(str, enum.Enum):
    VENDOR = "vendor"
    CUSTOMER = "customer"


class PaymentMethod(str, enum.Enum):
    CASH = "cash"
    BANK = "bank"


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[UUID] = mapped_column(primary_key=True, server_default=func.gen_random_uuid())
    payment_number: Mapped[str] = mapped_column(String(36), unique=True, nullable=False)
    status: Mapped[str] = mapped_column(
        Enum('draft', 'posted', 'cancelled', name='payment_status'),
        nullable=False, server_default='draft'
    )
    partner_type: Mapped[str] = mapped_column(
        Enum('vendor', 'customer', name='partner_type'), nullable=False
    )
    partner_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    payment_method: Mapped[str] = mapped_column(
        Enum('cash', 'bank', name='payment_method'), nullable=False
    )
    amount: Mapped[float] = mapped_column(Numeric(14, 2), nullable=False, server_default='0')
    payment_date: Mapped[datetime] = mapped_column(server_default=func.now())
    vendor_bill_id: Mapped[UUID | None] = mapped_column(ForeignKey("vendor_bills.id", ondelete="SET NULL"), nullable=True)
    customer_invoice_id: Mapped[UUID | None] = mapped_column(ForeignKey("customer_invoices.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(server_default=func.now(), onupdate=func.now())

