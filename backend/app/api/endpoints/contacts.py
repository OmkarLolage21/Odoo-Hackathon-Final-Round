from fastapi import APIRouter, Depends, status
from core.deps import get_current_active_user, require_contact_user, require_admin
from models.user_models import User

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get("/")
async def get_contacts(
    current_user: User = Depends(require_contact_user)
):
    """
    Get all contacts.
    Requires 'contact_user' or 'admin' role.
    """
    return {"message": "Contacts endpoint - Coming soon!", "user_role": current_user.role}


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_contact(
    current_user: User = Depends(require_contact_user)
):
    """
    Create a new contact.
    Requires 'contact_user' or 'admin' role.
    """
    return {"message": "Create contact endpoint - Coming soon!", "user_role": current_user.role}


@router.get("/{contact_id}")
async def get_contact(
    contact_id: str,
    current_user: User = Depends(require_contact_user)
):
    """
    Get a specific contact.
    Requires 'contact_user' or 'admin' role.
    """
    return {
        "message": f"Get contact {contact_id} - Coming soon!", 
        "user_role": current_user.role
    }
