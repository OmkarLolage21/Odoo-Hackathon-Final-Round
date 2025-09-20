from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, status, Query, Header, HTTPException
from core.deps import get_current_user
from models.user_models import User, UserRole
from schemas.schemas import Product as ProductSchema, ProductCreate, ProductUpdate, HSNResponse
from core.database import get_session
from sqlalchemy.ext.asyncio import AsyncSession
from services.product_service import ProductService

router = APIRouter(prefix="/products", tags=["Products"])


# Validate X-User-Role against authenticated user's role (same pattern as contacts)
async def verify_user_role(
    current_user: User = Depends(get_current_user),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> User:
    if not x_user_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-User-Role header is required"
        )

    try:
        requested_role = UserRole(x_user_role.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified"
        )

    if current_user.role != requested_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role in header does not match user's role"
        )

    return current_user


@router.get("/", response_model=list[ProductSchema])
async def get_products(
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    """List products. Requires invoicing_user or admin."""
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    service = ProductService(session)
    return await service.list_products()


@router.get("/{product_id}", response_model=ProductSchema)
async def get_product(
    product_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    """Get single product by id. Requires invoicing_user or admin."""
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    service = ProductService(session)
    product = await service.get_by_id(product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ProductSchema)
async def create_product(
    payload: ProductCreate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    """Create product. Requires invoicing_user or admin."""
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    service = ProductService(session)
    return await service.create_product(payload)


@router.get("/hsn/search", response_model=HSNResponse)
async def search_hsn(
    q: str = Query(..., alias="q", min_length=1),
    mode: str = Query("byCode", pattern="^(byCode|byDesc)$"),
    category: Optional[str] = Query(None),
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    """Proxy HSN search to GST service. Requires invoicing_user or admin.
    - mode: byCode or byDesc
    - category: e.g., 'P' for product when using byDesc
    """
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
    service = ProductService(session)
    return await service.hsn_search(q, mode=mode, category=category)


@router.put("/{product_id}", response_model=ProductSchema)
async def update_product(
    product_id: UUID,
    payload: ProductUpdate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    # Admin only for updates
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can update products"
        )
    service = ProductService(session)
    return await service.update_product(product_id, payload)


@router.delete("/{product_id}")
async def delete_product(
    product_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    # Admin only for deletes
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin can delete products"
        )
    service = ProductService(session)
    await service.delete_product(product_id)
    return {"message": "Product deleted successfully"}
