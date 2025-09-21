from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import get_current_user
from models.user_models import User, UserRole
from core.database import get_session
from schemas.schemas import CustomerInvoiceCreate, CustomerInvoiceResponse
from schemas.schemas import CustomerInvoiceCreate, CustomerInvoiceResponse
from pydantic import BaseModel
from services.customer_invoice_service import CustomerInvoiceService


router = APIRouter(prefix="/customer-invoices", tags=["Customer Invoices"])


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

class InvoiceStatusUpdate(BaseModel):
    status: str

@router.patch("/{invoice_id}/status", response_model=CustomerInvoiceResponse)
async def update_customer_invoice_status(
    invoice_id: UUID,
    payload: InvoiceStatusUpdate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = CustomerInvoiceService(session)
    try:
        if payload.status == 'posted':
            return await service.post_invoice(invoice_id)
        else:
            raise HTTPException(status_code=400, detail="Unsupported status transition")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/", response_model=CustomerInvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_customer_invoice(
    payload: CustomerInvoiceCreate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = CustomerInvoiceService(session)
    try:
        return await service.create_invoice(payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=list[CustomerInvoiceResponse])
async def list_customer_invoices(
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = CustomerInvoiceService(session)
    return await service.list_invoices()


@router.get("/{invoice_id}", response_model=CustomerInvoiceResponse)
async def get_customer_invoice(
    invoice_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = CustomerInvoiceService(session)
    inv = await service.get_invoice(invoice_id)
    if not inv:
        raise HTTPException(status_code=404, detail="Customer Invoice not found")
    return inv


@router.post("/from-sales-order/{sales_order_id}", response_model=CustomerInvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice_from_sales_order(
    sales_order_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = CustomerInvoiceService(session)
    try:
        return await service.create_invoice_from_sales_order(sales_order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
