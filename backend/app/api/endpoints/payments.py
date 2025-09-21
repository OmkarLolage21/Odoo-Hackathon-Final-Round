from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import get_current_user
from models.user_models import User, UserRole
from core.database import get_session
from schemas.schemas import PaymentCreate, PaymentResponse, PaymentUpdate
from services.payment_service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payments"])

async def verify_user_role(
    current_user: User = Depends(get_current_user),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> User:
    if not x_user_role:
        raise HTTPException(status_code=400, detail="X-User-Role header is required")
    try:
        role_enum = UserRole(x_user_role.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role specified")
    if current_user.role != role_enum:
        raise HTTPException(status_code=403, detail="Role in header does not match user's role")
    return current_user

@router.post("/", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    payload: PaymentCreate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = PaymentService(session)
    try:
        return await service.create_payment(payload)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/", response_model=list[PaymentResponse])
async def list_payments(
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = PaymentService(session)
    return await service.list_payments()

@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(
    payment_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = PaymentService(session)
    p = await service.get_payment(payment_id)
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return p

@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(
    payment_id: UUID,
    payload: PaymentUpdate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only admin can update payments")
    service = PaymentService(session)
    p = await service.update_payment(payment_id, payload)
    if not p:
        raise HTTPException(status_code=404, detail="Payment not found")
    return p
