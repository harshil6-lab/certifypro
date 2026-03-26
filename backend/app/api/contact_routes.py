from __future__ import annotations

from fastapi import APIRouter
from pydantic import BaseModel, EmailStr, Field

from app.services.contact_service import send_contact_message

router = APIRouter(prefix="/api/contact", tags=["Contact"])


class ContactPayload(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    message: str = Field(min_length=10, max_length=4000)


@router.post("")
async def submit_contact_message(payload: ContactPayload):
    result = send_contact_message(
        sender_name=payload.name,
        sender_email=payload.email,
        message=payload.message,
    )
    return {
        "success": True,
        "message": f"Your message has been sent to {result['brand_name']} support.",
        **result,
    }