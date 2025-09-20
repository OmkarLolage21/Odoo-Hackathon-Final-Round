from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from core.deps import get_current_user
from models.user_models import User, UserRole
from core.database import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from schemas.schemas import SalesOrderCreate, SalesOrderResponse, SalesOrderUpdate
from services.sales_order_service import SalesOrderService

router = APIRouter(prefix="/sales-orders", tags=["Sales Orders"])


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


@router.post("/", response_model=SalesOrderResponse, status_code=status.HTTP_201_CREATED)
async def create_sales_order(
    payload: SalesOrderCreate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    # Allow invoicing_user and admin to create draft orders
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = SalesOrderService(session)
    try:
        return await service.create_order(payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=list[SalesOrderResponse])
async def list_sales_orders(
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = SalesOrderService(session)
    return await service.list_orders()


@router.get("/{order_id}", response_model=SalesOrderResponse)
async def get_sales_order(
    order_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = SalesOrderService(session)
    order = await service.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Sales Order not found")
    return order


@router.put("/{order_id}", response_model=SalesOrderResponse)
async def update_sales_order(
    order_id: UUID,
    payload: SalesOrderUpdate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    # Restrict updates to admin only for now
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only admin can update sales orders")
    service = SalesOrderService(session)
    try:
        order = await service.update_order(order_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    if not order:
        raise HTTPException(status_code=404, detail="Sales Order not found")
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sales_order(
    order_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only admin can delete sales orders")
    service = SalesOrderService(session)
    deleted = await service.delete_order(order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Sales Order not found")
    return None