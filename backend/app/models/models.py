from datetime import datetime
from uuid import UUID
from sqlalchemy import Enum, String, ForeignKey
from sqlalchemy.orm import mapped_column, Mapped, relationship
from sqlalchemy.sql import func

from core.database import Base

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
