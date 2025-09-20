from fastapi import APIRouter, Depends, status
from core.deps import get_current_active_user, require_invoicing_user, require_admin
from models.user_models import User

router = APIRouter(prefix="/products", tags=["Products"])


@router.get("/")
async def get_products(
    current_user: User = Depends(require_invoicing_user)
):
    """
    Get all products.
    Requires 'invoicing_user' or 'admin' role.
    """
    return {"message": "Products endpoint - Coming soon!", "user_role": current_user.role}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_product(
    current_user: User = Depends(require_invoicing_user)
):
    """
    Create a new product.
    Requires 'invoicing_user' or 'admin' role.
    """
    return {"message": "Create product endpoint - Coming soon!", "user_role": current_user.role}


@router.get("/{product_id}")
async def get_product(
    product_id: str,
    current_user: User = Depends(require_invoicing_user)
):
    """
    Get a specific product.
    Requires 'invoicing_user' or 'admin' role.
    """
    return {
        "message": f"Get product {product_id} - Coming soon!", 
        "user_role": current_user.role
    }
