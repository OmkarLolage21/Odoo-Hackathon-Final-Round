from fastapi import APIRouter

from api.endpoints import auth, contacts

# Create main API router
router = APIRouter(prefix="/api/v1")

# Include endpoint routers
router.include_router(auth.router)
router.include_router(contacts.router)

# Export the router
__all__ = ["router"]
