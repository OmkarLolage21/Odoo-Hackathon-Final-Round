from typing import Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.security import verify_token
from models.user_models import User
from repositories.user_repository import UserRepository

# HTTP Bearer token scheme
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: AsyncSession = Depends(get_session)
) -> User:
    """
    Dependency to get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials
        session: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Verify token
    payload = verify_token(credentials.credentials, "access")
    if payload is None:
        raise credentials_exception
    
    # Extract user ID from token
    user_id_str = payload.get("sub")
    if user_id_str is None:
        raise credentials_exception
    
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise credentials_exception
    
    # Get user from database
    user_repo = UserRepository(session)
    user = await user_repo.get_by_id(user_id)
    
    if user is None or not user.is_active:
        raise credentials_exception
    
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Dependency to get current active user.
    
    Args:
        current_user: Current user from get_current_user
        
    Returns:
        User: Current active user
        
    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


def _extract_role_value(role_obj) -> str:
    try:
        return role_obj.value  # Enum case
    except Exception:
        return str(role_obj)


def require_role(required_role: str):
    """Dependency factory to require a specific user role (supports Enums)."""
    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = _extract_role_value(current_user.role)
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker


def require_any_role(*roles: str):
    """Dependency factory to allow access if user has any of the given roles."""
    allowed = set(roles)

    def role_checker(current_user: User = Depends(get_current_active_user)) -> User:
        user_role = _extract_role_value(current_user.role)
        if user_role not in allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user

    return role_checker


# Role-specific dependencies
require_admin = require_role("admin")
require_invoicing_user = require_role("invoicing_user")
require_contact_user = require_role("contact_user")
require_invoicing_or_admin = require_any_role("invoicing_user", "admin")


async def get_request_info(request: Request) -> dict:
    """
    Extract request information for logging and security.
    
    Args:
        request: FastAPI request object
        
    Returns:
        dict: Request information
    """
    return {
        "user_agent": request.headers.get("User-Agent"),
        "ip_address": request.client.host if request.client else None,
        "method": request.method,
        "url": str(request.url),
    }


async def get_current_user_with_role(
    current_user: User = Depends(get_current_user),
    role: str = Header(..., alias="X-User-Role")
) -> User:
    """
    Gets the current user and verifies that the role passed in the header
    matches the user's actual role from the JWT token.
    """
    # Assuming the 'role' attribute on the User model is an Enum
    if current_user.role.value != role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role in header does not match user's authenticated role."
        )
    return current_user
