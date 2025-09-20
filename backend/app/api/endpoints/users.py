from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from core.database import get_session
from core.deps import get_current_user_with_role
from models.user_models import User as UserModel, UserRole
from schemas.user_schemas import UserWithProfile


router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=List[UserWithProfile])
async def get_users(
    current_user: UserModel = Depends(get_current_user_with_role),
    session: AsyncSession = Depends(get_session),
):
    """
    Return all users (with profiles) for admin role.
    Requires Authorization Bearer token and X-User-Role header that matches the authenticated user's role.
    """
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin users can access users list",
        )

    result = await session.execute(
        select(UserModel).options(selectinload(UserModel.profile)).order_by(UserModel.created_at.desc())
    )
    users = result.scalars().all()
    return users
