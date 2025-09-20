from datetime import datetime, timedelta
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from core.security import (
    verify_password, 
    get_password_hash,  # Add this import
    create_access_token, 
    create_refresh_token,
    verify_token,
    generate_refresh_token_hash
)
from config.settings import settings
from models.user_models import User
from repositories.user_repository import UserRepository, RefreshTokenRepository
from schemas.user_schemas import (
    UserRegister, 
    UserLogin, 
    TokenResponse,
    UserWithProfile
)


class AuthService:
    """Authentication service handling user registration, login, and token management."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
        self.user_repo = UserRepository(session)
        self.refresh_repo = RefreshTokenRepository(session)
    
    async def register_user(
        self, 
        user_data: UserRegister, 
        user_agent: Optional[str] = None, 
        ip_address: Optional[str] = None
    ) -> TokenResponse:
        """
        Register a new user and return authentication tokens.
        
        Args:
            user_data: User registration data
            user_agent: Client user agent
            ip_address: Client IP address
            
        Returns:
            TokenResponse: Access and refresh tokens
            
        Raises:
            HTTPException: If email or username already exists
        """
        # Check email uniqueness
        if await self.user_repo.email_exists(user_data.email):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Check username uniqueness
        if await self.user_repo.username_exists(user_data.username):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )

        # Create user with profile
        # Properly hash the incoming password before storing
        password_hash = get_password_hash(user_data.password)
        user = await self.user_repo.create_user_with_profile(
            email=user_data.email,
            password_hash=password_hash,  # Now properly hashed
            username=user_data.username,
            role=user_data.role,
            full_name=user_data.full_name
        )

        # Generate tokens
        return await self._generate_token_response(user, user_agent, ip_address)
    
    async def login_user(
        self, 
        login_data: UserLogin, 
        user_agent: Optional[str] = None, 
        ip_address: Optional[str] = None
    ) -> TokenResponse:
        """
        Authenticate user and return tokens.
        
        Args:
            login_data: User login credentials
            user_agent: Client user agent
            ip_address: Client IP address
            
        Returns:
            TokenResponse: Access and refresh tokens
            
        Raises:
            HTTPException: If credentials are invalid or user is inactive
        """
        # Find user by email
        user = await self.user_repo.get_by_email(login_data.email)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(login_data.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User account is inactive"
            )
        
        # Generate tokens
        return await self._generate_token_response(user, user_agent, ip_address)
    
    async def refresh_tokens(
        self, 
        refresh_token: str, 
        user_agent: Optional[str] = None, 
        ip_address: Optional[str] = None
    ) -> TokenResponse:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Current refresh token
            user_agent: Client user agent
            ip_address: Client IP address
            
        Returns:
            TokenResponse: New access and refresh tokens
            
        Raises:
            HTTPException: If refresh token is invalid or expired
        """
        # Verify refresh token
        payload = verify_token(refresh_token, "refresh")
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Check if token exists in database
        token_hash = generate_refresh_token_hash(refresh_token)
        stored_token = await self.refresh_repo.get_by_token_hash(token_hash)
        
        if not stored_token or not stored_token.is_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user
        user = await self.user_repo.get_by_id(stored_token.user_id)
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Revoke old refresh token
        await self.refresh_repo.revoke_token(token_hash)
        
        # Generate new tokens
        return await self._generate_token_response(user, user_agent, ip_address)
    
    async def logout_user(self, refresh_token: str) -> bool:
        """
        Logout user by revoking refresh token.
        
        Args:
            refresh_token: Refresh token to revoke
            
        Returns:
            bool: True if successful
        """
        token_hash = generate_refresh_token_hash(refresh_token)
        return await self.refresh_repo.revoke_token(token_hash)
    
    async def logout_all_sessions(self, user_id: str) -> bool:
        """
        Logout user from all sessions by revoking all refresh tokens.
        
        Args:
            user_id: User ID
            
        Returns:
            bool: True if successful
        """
        return await self.refresh_repo.revoke_all_user_tokens(user_id)
    
    async def get_user_profile(self, user_id: str) -> UserWithProfile:
        """
        Get user profile information.
        
        Args:
            user_id: User ID
            
        Returns:
            UserWithProfile: User with profile data
            
        Raises:
            HTTPException: If user not found
        """
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserWithProfile.from_orm(user)
    
    async def change_password(
        self, 
        user_id: str, 
        current_password: str, 
        new_password: str
    ) -> bool:
        """
        Change user password.
        
        Args:
            user_id: User ID
            current_password: Current password
            new_password: New password
            
        Returns:
            bool: True if successful
            
        Raises:
            HTTPException: If current password is incorrect
        """
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not verify_password(current_password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        await self.user_repo.update_password(user_id, new_password)
        
        # Revoke all refresh tokens for security
        await self.refresh_repo.revoke_all_user_tokens(user_id)
        
        return True
    
    async def _generate_token_response(
        self, 
        user: User, 
        user_agent: Optional[str] = None, 
        ip_address: Optional[str] = None
    ) -> TokenResponse:
        """
        Generate access and refresh tokens for user.
        
        Args:
            user: User object
            user_agent: Client user agent
            ip_address: Client IP address
            
        Returns:
            TokenResponse: Token response with access and refresh tokens
        """
        # Generate access token
        access_token_data = {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role
        }
        access_token = create_access_token(access_token_data)
        
        # Generate refresh token
        refresh_token_data = {
            "sub": str(user.id)
        }
        refresh_token = create_refresh_token(refresh_token_data)
        
        # Store refresh token in database
        await self.refresh_repo.create_refresh_token(
            user_id=user.id,
            refresh_token=refresh_token,
            user_agent=user_agent,
            ip_address=ip_address
        )
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
