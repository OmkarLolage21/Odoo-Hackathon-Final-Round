from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, validator

from config.settings import settings

# ======== User & Auth Schemas (Your Original Schemas) ========

class UserBase(BaseModel):
    email: EmailStr
    role: str  # 'admin', 'invoicing_user', 'contact_user'


class UserCreate(UserBase):
    password: str


class UserRead(UserBase):
    id: UUID
    is_active: bool

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# ======== Extended Authentication Schemas ========

class UserRegister(BaseModel):
    """Schema for user registration"""
    email: EmailStr
    password: str = Field(
        min_length=settings.PASSWORD_MIN_LENGTH,
        max_length=settings.PASSWORD_MAX_LENGTH,
        description=f"Password must be between {settings.PASSWORD_MIN_LENGTH}-{settings.PASSWORD_MAX_LENGTH} characters"
    )
    username: str = Field(
        min_length=settings.USERNAME_MIN_LENGTH,
        max_length=settings.USERNAME_MAX_LENGTH,
        pattern=r'^[a-zA-Z0-9_-]+$',
        description="Username must contain only letters, numbers, underscores, and hyphens"
    )
    full_name: Optional[str] = Field(None, max_length=100)
    role: str = Field(default="contact_user", description="User role")

    @validator("role")
    def validate_role(cls, v):
        allowed_roles = ["admin", "invoicing_user", "contact_user"]
        if v not in allowed_roles:
            raise ValueError(f"Role must be one of: {', '.join(allowed_roles)}")
        return v


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Access token expiration in seconds


class TokenRefresh(BaseModel):
    """Schema for token refresh request"""
    refresh_token: str


class UserProfile(BaseModel):
    """Schema for user profile information"""
    id: UUID
    user_id: UUID
    username: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserWithProfile(UserRead):
    """Schema for user with profile information"""
    profile: Optional[UserProfile] = None

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    """Schema for updating user information"""
    full_name: Optional[str] = Field(None, max_length=100)
    bio: Optional[str] = Field(None, max_length=500)


class PasswordChange(BaseModel):
    """Schema for password change"""
    current_password: str
    new_password: str = Field(
        min_length=settings.PASSWORD_MIN_LENGTH,
        max_length=settings.PASSWORD_MAX_LENGTH
    )
    confirm_password: str

    @validator("confirm_password")
    def passwords_match(cls, v, values):
        if "new_password" in values and v != values["new_password"]:
            raise ValueError("Passwords do not match")
        return v


class UserSession(BaseModel):
    """Schema for user session information"""
    id: UUID
    user_agent: Optional[str] = None
    ip_address: Optional[str] = None
    is_active: bool
    expires_at: datetime
    created_at: datetime

    class Config:
        from_attributes = True
