from typing import List

from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_session
from core.deps import get_current_active_user
from core.security import extract_user_agent_and_ip
from models.user_models import User
from schemas.user_schemas import (
    UserRegister,
    UserLogin,
    TokenResponse,
    TokenRefresh,
    UserWithProfile,
    PasswordChange,
    UserSession
)
from services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Register a new user.
    
    - **email**: Valid email address
    - **password**: Password (8-128 characters)
    - **username**: Username (3-30 characters, alphanumeric + underscore/hyphen)
    - **full_name**: Optional full name
    - **role**: User role (admin, invoicing_user, contact_user)
    """
    auth_service = AuthService(session)
    user_agent, ip_address = extract_user_agent_and_ip(request)
    
    return await auth_service.register_user(user_data, user_agent, ip_address)


@router.post("/login", response_model=TokenResponse)
async def login(
    login_data: UserLogin,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Authenticate user and return access tokens.
    
    - **email**: User email address
    - **password**: User password
    """
    auth_service = AuthService(session)
    user_agent, ip_address = extract_user_agent_and_ip(request)
    
    return await auth_service.login_user(login_data, user_agent, ip_address)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    token_data: TokenRefresh,
    request: Request,
    session: AsyncSession = Depends(get_session)
):
    """
    Refresh access token using refresh token.
    
    - **refresh_token**: Valid refresh token
    """
    auth_service = AuthService(session)
    user_agent, ip_address = extract_user_agent_and_ip(request)
    
    return await auth_service.refresh_tokens(
        token_data.refresh_token, user_agent, ip_address
    )


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    token_data: TokenRefresh,
    session: AsyncSession = Depends(get_session)
):
    """
    Logout user by revoking refresh token.
    
    - **refresh_token**: Refresh token to revoke
    """
    auth_service = AuthService(session)
    await auth_service.logout_user(token_data.refresh_token)


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
async def logout_all_sessions(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Logout user from all sessions by revoking all refresh tokens.
    Requires authentication.
    """
    auth_service = AuthService(session)
    await auth_service.logout_all_sessions(current_user.id)


@router.get("/me", response_model=UserWithProfile)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get current user profile information.
    Requires authentication.
    """
    auth_service = AuthService(session)
    return await auth_service.get_user_profile(current_user.id)


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    password_data: PasswordChange,
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Change user password.
    Requires authentication. Will revoke all existing sessions.
    
    - **current_password**: Current password
    - **new_password**: New password (8-128 characters)
    - **confirm_password**: Confirm new password
    """
    auth_service = AuthService(session)
    await auth_service.change_password(
        current_user.id,
        password_data.current_password,
        password_data.new_password
    )


@router.get("/sessions", response_model=List[UserSession])
async def get_user_sessions(
    current_user: User = Depends(get_current_active_user),
    session: AsyncSession = Depends(get_session)
):
    """
    Get all active sessions for current user.
    Requires authentication.
    """
    from repositories.user_repository import RefreshTokenRepository
    
    refresh_repo = RefreshTokenRepository(session)
    sessions = await refresh_repo.get_user_sessions(current_user.id)
    
    return [UserSession.from_orm(session) for session in sessions]


# Health check endpoint for authentication service
@router.get("/health")
async def auth_health_check():
    """Health check endpoint for authentication service."""
    return {"status": "healthy", "service": "authentication"}
