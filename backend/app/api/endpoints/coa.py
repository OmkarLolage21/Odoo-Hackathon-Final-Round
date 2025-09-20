from typing import List
from uuid import UUID
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.deps import get_current_user
from models.models import ChartOfAccount
from models.user_models import User, UserRole
from pydantic import BaseModel


class AccountBase(BaseModel):
    name: str
    type: str  # 'asset' | 'liability' | 'expense' | 'income' | 'equity'


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: str | None = None
    type: str | None = None


class AccountResponse(BaseModel):
    id: UUID
    name: str
    type: str
    created_at: datetime
    is_active: bool

    class Config:
        from_attributes = True


router = APIRouter(prefix="/chart-of-accounts", tags=["chart-of-accounts"])


@router.post("/", response_model=AccountResponse)
async def create_account(
    account: AccountCreate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role"),
):
    # Admin and invoicing users can create
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER] or x_user_role.lower() not in ["admin", "invoicing_user"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and invoicing users can create accounts",
        )

    db_account = ChartOfAccount(**account.model_dump())
    session.add(db_account)
    await session.commit()
    await session.refresh(db_account)
    return db_account


@router.get("/", response_model=List[AccountResponse])
async def get_accounts(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role"),
):
    # Admin and invoicing users can view list
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER] or x_user_role.lower() not in ["admin", "invoicing_user"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and invoicing users can view accounts",
        )

    result = await session.execute(select(ChartOfAccount))
    return result.scalars().all()


@router.get("/{account_id}", response_model=AccountResponse)
async def get_account(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role"),
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER] or x_user_role.lower() not in ["admin", "invoicing_user"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and invoicing users can view accounts",
        )

    result = await session.execute(select(ChartOfAccount).where(ChartOfAccount.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountResponse)
async def update_account(
    account_id: UUID,
    account_update: AccountUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role"),
):
    # Only admin can update
    if current_user.role != UserRole.ADMIN or x_user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can modify accounts",
        )

    result = await session.execute(select(ChartOfAccount).where(ChartOfAccount.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    update_data = account_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(account, field, value)

    await session.commit()
    await session.refresh(account)
    return account


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_account(
    account_id: UUID,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
    x_user_role: str = Header(..., alias="X-User-Role"),
):
    # Only admin can delete
    if current_user.role != UserRole.ADMIN or x_user_role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete accounts",
        )

    result = await session.execute(select(ChartOfAccount).where(ChartOfAccount.id == account_id))
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found")

    await session.delete(account)
    await session.commit()
    return None
