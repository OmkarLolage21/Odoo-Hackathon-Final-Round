from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr

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
