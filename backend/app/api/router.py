from fastapi import APIRouter

from api.endpoints import auth, contacts, users, taxes, products, coa, sales_orders, purchase_orders

# Create main API router
router = APIRouter(prefix="/api/v1")

# Include endpoint routers
router.include_router(auth.router)
router.include_router(contacts.router)
router.include_router(users.router)
router.include_router(coa.router)
router.include_router(products.router)
router.include_router(taxes.router)
router.include_router(sales_orders.router)
router.include_router(purchase_orders.router)

# Backward-compatible alias
api_router = router

# Export the routers
__all__ = ["router", "api_router"]
