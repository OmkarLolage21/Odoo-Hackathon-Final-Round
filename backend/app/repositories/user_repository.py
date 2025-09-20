from datetime import datetime, timedelta
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, update, delete
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from models.user_models import User, UserProfile, AuthRefreshToken
from core.security import get_password_hash, generate_refresh_token_hash


class UserRepository:
    """Repository pattern for user-related database operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID with profile."""
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.id == user_id)
        )
        return result.scalar_one_or_none()
    
    async def get_by_email(self, email: str) -> Optional[User]:
        """Get user by email with profile."""
        result = await self.session.execute(
            select(User)
            .options(selectinload(User.profile))
            .where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_by_username(self, username: str) -> Optional[User]:
        """Get user by username with profile."""
        result = await self.session.execute(
            select(User)
            .join(UserProfile)
            .options(selectinload(User.profile))
            .where(UserProfile.username == username)
        )
        return result.scalar_one_or_none()
    
    async def email_exists(self, email: str) -> bool:
        """Check if email already exists."""
        result = await self.session.execute(
            select(User.id).where(User.email == email)
        )
        return result.scalar_one_or_none() is not None
    
    async def username_exists(self, username: str) -> bool:
        """Check if username already exists."""
        result = await self.session.execute(
            select(UserProfile.id).where(UserProfile.username == username)
        )
        return result.scalar_one_or_none() is not None
    
    async def create_user_with_profile(
        self,
        email: str,
        password_hash: str,
        username: str,
        role: str = "contact_user",
        full_name: Optional[str] = None
    ) -> User:
        """Create user with profile in a transaction."""
        try:
            # Create user
            user = User(
                email=email,
                hashed_password=password_hash,
                role=role,
                is_active=True
            )
            self.session.add(user)
            await self.session.flush()  # Get user ID
            
            # Create profile
            profile = UserProfile(
                user_id=user.id,
                username=username,
                full_name=full_name
            )
            self.session.add(profile)
            
            await self.session.commit()
            await self.session.refresh(user)
            await self.session.refresh(profile)
            
            # Load profile relationship
            result = await self.session.execute(
                select(User)
                .options(selectinload(User.profile))
                .where(User.id == user.id)
            )
            return result.scalar_one()
            
        except Exception:
            await self.session.rollback()
            raise
    
    async def update_user(self, user_id: UUID, **kwargs) -> Optional[User]:
        """Update user information."""
        try:
            await self.session.execute(
                update(User)
                .where(User.id == user_id)
                .values(**kwargs)
            )
            await self.session.commit()
            return await self.get_by_id(user_id)
        except Exception:
            await self.session.rollback()
            raise
    
    async def update_profile(self, user_id: UUID, **kwargs) -> Optional[User]:
        """Update user profile information."""
        try:
            await self.session.execute(
                update(UserProfile)
                .where(UserProfile.user_id == user_id)
                .values(**kwargs, updated_at=datetime.utcnow())
            )
            await self.session.commit()
            return await self.get_by_id(user_id)
        except Exception:
            await self.session.rollback()
            raise
    
    async def update_password(self, user_id: UUID, new_password: str) -> bool:
        """Update user password."""
        try:
            password_hash = get_password_hash(new_password)
            await self.session.execute(
                update(User)
                .where(User.id == user_id)
                .values(hashed_password=password_hash, updated_at=datetime.utcnow())
            )
            await self.session.commit()
            return True
        except Exception:
            await self.session.rollback()
            raise
    
    async def deactivate_user(self, user_id: UUID) -> bool:
        """Deactivate user account."""
        try:
            await self.session.execute(
                update(User)
                .where(User.id == user_id)
                .values(is_active=False, updated_at=datetime.utcnow())
            )
            await self.session.commit()
            return True
        except Exception:
            await self.session.rollback()
            raise


class RefreshTokenRepository:
    """Repository pattern for refresh token operations."""
    
    def __init__(self, session: AsyncSession):
        self.session = session
    
    async def create_refresh_token(
        self,
        user_id: UUID,
        refresh_token: str,
        user_agent: Optional[str] = None,
        ip_address: Optional[str] = None,
        expires_at: Optional[datetime] = None
    ) -> AuthRefreshToken:
        """Create and store refresh token."""
        try:
            if expires_at is None:
                expires_at = datetime.utcnow() + timedelta(days=7)
            
            token_hash = generate_refresh_token_hash(refresh_token)
            
            auth_token = AuthRefreshToken(
                user_id=user_id,
                token_hash=token_hash,
                user_agent=user_agent,
                ip_address=ip_address,
                expires_at=expires_at,
                is_active=True
            )
            
            self.session.add(auth_token)
            await self.session.commit()
            await self.session.refresh(auth_token)
            
            return auth_token
            
        except Exception:
            await self.session.rollback()
            raise
    
    async def get_by_token_hash(self, token_hash: str) -> Optional[AuthRefreshToken]:
        """Get refresh token by hash."""
        result = await self.session.execute(
            select(AuthRefreshToken).where(AuthRefreshToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()
    
    async def revoke_token(self, token_hash: str) -> bool:
        """Revoke a specific refresh token."""
        try:
            await self.session.execute(
                update(AuthRefreshToken)
                .where(AuthRefreshToken.token_hash == token_hash)
                .values(is_active=False, revoked_at=datetime.utcnow())
            )
            await self.session.commit()
            return True
        except Exception:
            await self.session.rollback()
            raise
    
    async def revoke_all_user_tokens(self, user_id: UUID) -> bool:
        """Revoke all refresh tokens for a user."""
        try:
            await self.session.execute(
                update(AuthRefreshToken)
                .where(AuthRefreshToken.user_id == user_id)
                .values(is_active=False, revoked_at=datetime.utcnow())
            )
            await self.session.commit()
            return True
        except Exception:
            await self.session.rollback()
            raise
    
    async def cleanup_expired_tokens(self) -> int:
        """Remove expired refresh tokens."""
        try:
            result = await self.session.execute(
                delete(AuthRefreshToken)
                .where(AuthRefreshToken.expires_at < datetime.utcnow())
            )
            await self.session.commit()
            return result.rowcount
        except Exception:
            await self.session.rollback()
            raise
    
    async def get_user_sessions(self, user_id: UUID) -> List[AuthRefreshToken]:
        """Get all active sessions for a user."""
        result = await self.session.execute(
            select(AuthRefreshToken)
            .where(
                AuthRefreshToken.user_id == user_id,
                AuthRefreshToken.is_active == True,
                AuthRefreshToken.expires_at > datetime.utcnow()
            )
            .order_by(AuthRefreshToken.created_at.desc())
        )
        return result.scalars().all()
