from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from core.database import get_session
from core.deps import get_current_user
from models.models import Tax
from models.user_models import User, UserRole
from pydantic import BaseModel, condecimal
from typing import Optional
from datetime import datetime

# Pydantic models for request/response
class TaxBase(BaseModel):
    name: str
    computation_method: str  # 'percentage' or 'fixed'
    value: float
    is_applicable_on_sales: bool = True
    is_applicable_on_purchase: bool = True

class TaxCreate(TaxBase):
    pass

class TaxUpdate(BaseModel):
    name: str | None = None
    computation_method: str | None = None
    value: float | None = None
    is_applicable_on_sales: bool | None = None
    is_applicable_on_purchase: bool | None = None

class TaxResponse(TaxBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

router = APIRouter(prefix="/taxes", tags=["taxes"])

@router.post("/", response_model=TaxResponse)
async def create_tax(
    tax: TaxCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role")
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER] or x_user_role.lower() not in ["admin", "invoicing_user"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and invoicing users can create taxes"
        )
    
    db_tax = Tax(**tax.model_dump())
    session.add(db_tax)
    await session.commit()
    await session.refresh(db_tax)
    return db_tax

@router.get("/", response_model=List[TaxResponse])
async def get_taxes(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role")
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER] or x_user_role.lower() not in ["admin", "invoicing_user"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and invoicing users can view taxes"
        )
    
    query = select(Tax)
    result = await session.execute(query)
    taxes = result.scalars().all()
    return taxes

@router.get("/{tax_id}", response_model=TaxResponse)
async def get_tax(
    tax_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role")
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER] or x_user_role.lower() not in ["admin", "invoicing_user"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and invoicing users can view taxes"
        )
    
    query = select(Tax).where(Tax.id == tax_id)
    result = await session.execute(query)
    tax = result.scalar_one_or_none()
    
    if not tax:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax not found"
        )
    
    return tax

@router.put("/{tax_id}", response_model=TaxResponse)
async def update_tax(
    tax_id: UUID,
    tax_update: TaxUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role")
):
    # Only admin can update taxes
    if current_user.role != UserRole.ADMIN or x_user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can modify taxes"
        )
    
    query = select(Tax).where(Tax.id == tax_id)
    result = await session.execute(query)
    tax = result.scalar_one_or_none()
    
    if not tax:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax not found"
        )
    
    # Update only provided fields
    update_data = tax_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(tax, field, value)
    
    await session.commit()
    await session.refresh(tax)
    return tax

@router.delete("/{tax_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_tax(
    tax_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role")
):
    # Only admin can delete taxes
    if current_user.role != UserRole.ADMIN or x_user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete taxes"
        )
    
    query = select(Tax).where(Tax.id == tax_id)
    result = await session.execute(query)
    tax = result.scalar_one_or_none()
    
    if not tax:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tax not found"
        )
    
    # Hard delete the tax
    await session.delete(tax)
    await session.commit()