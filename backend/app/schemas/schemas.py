from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

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
