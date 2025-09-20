from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from core.database import get_session
from core.deps import get_current_user
from models.models import Contact
from models.user_models import User, UserRole
from schemas.schemas import ContactCreate, ContactResponse, ContactUpdate

router = APIRouter(prefix="/contacts", tags=["contacts"])

async def verify_user_role(
    current_user: User = Depends(get_current_user),
    x_user_role: Optional[str] = Header(None, alias="X-User-Role")
) -> User:
    if not x_user_role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-User-Role header is required"
        )
    
    try:
        requested_role = UserRole(x_user_role.lower())
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid role specified"
        )
    
    if current_user.role != requested_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Role in header does not match user's role"
        )
    
    return current_user

@router.post("/", response_model=ContactResponse)
async def create_contact(
    contact: ContactCreate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    # Only admin and invoicing_user can create contacts
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and invoicing users can create contacts"
        )
    
    db_contact = Contact(**contact.model_dump())
    session.add(db_contact)
    await session.commit()
    await session.refresh(db_contact)
    return db_contact

@router.get("/", response_model=List[ContactResponse])
async def get_contacts(
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    # Build query based on user role
    if current_user.role == UserRole.CONTACT_USER:
        # Contact users can only see their own contact
        query = select(Contact).where(Contact.user_id == current_user.id)
    elif current_user.role in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        # Admin and invoicing users can see all contacts
        query = select(Contact)
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to access contacts"
        )
    
    result = await session.execute(query)
    contacts = result.scalars().all()
    return contacts

@router.get("/{contact_id}", response_model=ContactResponse)
async def get_contact(
    contact_id: UUID,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    query = select(Contact).where(Contact.id == contact_id)
    
    if current_user.role == UserRole.CONTACT_USER:
        # Contact users can only access their own contact
        query = query.where(Contact.user_id == current_user.id)
    elif current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions"
        )
    
    result = await session.execute(query)
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    return contact

@router.put("/{contact_id}", response_model=ContactResponse)
async def update_contact(
    contact_id: UUID,
    contact_update: ContactUpdate,
    current_user: User = Depends(verify_user_role),
    session: AsyncSession = Depends(get_session)
):
    if current_user.role not in [UserRole.ADMIN, UserRole.INVOICING_USER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admin and invoicing users can update contacts"
        )
        
    query = select(Contact).where(Contact.id == contact_id)
    result = await session.execute(query)
    contact = result.scalar_one_or_none()
    
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )
    
    for field, value in contact_update.model_dump(exclude_unset=True).items():
        setattr(contact, field, value)
    
    await session.commit()
    await session.refresh(contact)
    return contact


@router.delete("/{contact_id}")
async def delete_contact(
    contact_id: UUID,
    session: AsyncSession = Depends(get_session)
):
    query = select(Contact).where(Contact.id == contact_id)
    result = await session.execute(query)
    contact = result.scalar_one_or_none()
    if not contact:
        raise HTTPException(status_code=404, detail="Contact not found")
    
    await session.delete(contact)
    await session.commit()
    return {"message": "Contact deleted successfully"}
