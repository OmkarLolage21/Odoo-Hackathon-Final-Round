from fastapi import APIRouter

from api.endpoints import auth

# Create main API router
api_router = APIRouter(prefix="/api/v1")

# Include endpoint routers
api_router.include_router(auth.router)
