from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from core.deps import get_current_user
from models.user_models import User, UserRole
from core.database import get_session
from schemas.schemas import VendorBillCreate, VendorBillResponse, VendorBillUpdate
from services.vendor_bill_service import VendorBillService


router = APIRouter(prefix="/vendor-bills", tags=["Vendor Bills"])


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


@router.post("/", response_model=VendorBillResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor_bill(
    payload: VendorBillCreate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = VendorBillService(session)
    try:
        return await service.create_bill(payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=list[VendorBillResponse])
async def list_vendor_bills(
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = VendorBillService(session)
    return await service.list_bills()


@router.get("/{bill_id}", response_model=VendorBillResponse)
async def get_vendor_bill(
    bill_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    service = VendorBillService(session)
    bill = await service.get_bill(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail="Vendor Bill not found")
    return bill


@router.put("/{bill_id}", response_model=VendorBillResponse)
async def update_vendor_bill(
    bill_id: UUID,
    payload: VendorBillUpdate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Only admin can update vendor bills")
    service = VendorBillService(session)
    try:
        bill = await service.update_bill(bill_id, payload)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    if not bill:
        raise HTTPException(status_code=404, detail="Vendor Bill not found")
    return bill
