from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from core.deps import get_current_user
from models.user_models import User, UserRole
from core.database import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from schemas.schemas import PurchaseOrderCreate, PurchaseOrderResponse, PurchaseOrderUpdate
from services.purchase_order_service import PurchaseOrderService

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

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

@router.post("/", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_purchase_order(
    payload: PurchaseOrderCreate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = PurchaseOrderService(session)
    try:
        return await service.create_order(payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/", response_model=list[PurchaseOrderResponse])
async def list_purchase_orders(
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = PurchaseOrderService(session)
    return await service.list_orders()

@router.get("/{order_id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    order_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = PurchaseOrderService(session)
    order = await service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return order

@router.put("/{order_id}", response_model=PurchaseOrderResponse)
async def update_purchase_order(
    order_id: UUID,
    payload: PurchaseOrderUpdate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only admin can update purchase orders")
    service = PurchaseOrderService(session)
    try:
        order = await service.update_order(order_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    if not order:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return order

@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_purchase_order(
    order_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only admin can delete purchase orders")
    service = PurchaseOrderService(session)
    deleted = await service.delete_order(order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    return None
