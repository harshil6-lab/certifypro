"""
Razorpay subscription and payment routes for CertifyPro.

Endpoints:
  GET  /subscription/me            → get current user's subscription
  POST /subscription/create-order  → create Razorpay order for Pro plan
  POST /subscription/verify        → verify payment signature and upgrade to Pro
  POST /subscription/select-free   → mark user as having selected the free plan
  POST /subscription/webhook       → Razorpay webhook (optional, for renewals)
"""

import hashlib
import hmac
import os

import razorpay
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from ..core.supabase_client import get_supabase_service_client

router = APIRouter(prefix="/subscription", tags=["subscription"])

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
RAZORPAY_PLAN_ID = os.getenv("RAZORPAY_PLAN_ID", "")

PRO_AMOUNT_PAISE = 49900  # ₹499 in paise


def get_razorpay_client():
    return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))


def get_user_id_from_request(request: Request) -> str:
    """Extract user_id set by AuthMiddleware."""
    user = getattr(request.state, "user", None)
    if not user or not user.get("id"):
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user["id"]


# ---------------------------------------------------------------------------
# GET /subscription/me
# ---------------------------------------------------------------------------

@router.get("/me")
async def get_my_subscription(request: Request):
    """Return the current user's subscription info."""
    user_id = get_user_id_from_request(request)
    supabase = get_supabase_service_client()

    result = supabase.table("subscriptions").select("*").eq("user_id", user_id).single().execute()

    if not result.data:
        # Auto-create if missing (safety net)
        supabase.table("subscriptions").insert({
            "user_id": user_id,
            "plan": "free",
            "plan_selected": False,
            "credits_used": 0,
            "credits_limit": 12,
        }).execute()
        return {
            "plan": "free",
            "plan_selected": False,
            "credits_used": 0,
            "credits_limit": 12,
            "credits_remaining": 12,
        }

    sub = result.data
    credits_remaining = None
    if sub["plan"] == "free":
        credits_remaining = max(0, (sub["credits_limit"] or 12) - sub["credits_used"])

    return {
        "plan": sub["plan"],
        "plan_selected": sub["plan_selected"],
        "credits_used": sub["credits_used"],
        "credits_limit": sub["credits_limit"],
        "credits_remaining": credits_remaining,
    }


# ---------------------------------------------------------------------------
# POST /subscription/select-free
# ---------------------------------------------------------------------------

@router.post("/select-free")
async def select_free_plan(request: Request):
    """Mark user as having consciously selected the free plan."""
    user_id = get_user_id_from_request(request)
    supabase = get_supabase_service_client()

    supabase.table("subscriptions").update({
        "plan_selected": True,
    }).eq("user_id", user_id).execute()

    return {"success": True, "plan": "free"}


# ---------------------------------------------------------------------------
# POST /subscription/create-order
# ---------------------------------------------------------------------------

@router.post("/create-order")
async def create_order(request: Request):
    """
    Creates a Razorpay order for the Pro plan.
    Returns { order_id, amount, currency, key_id } to the frontend.
    """
    user_id = get_user_id_from_request(request)
    supabase = get_supabase_service_client()
    rz = get_razorpay_client()

    try:
        order = rz.order.create({
            "amount": PRO_AMOUNT_PAISE,
            "currency": "INR",
            "notes": {
                "user_id": user_id,
                "plan": "pro",
                "product": "CertifyPro Pro Monthly",
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay order creation failed: {str(e)}")

    # Save order to DB for audit trail
    supabase.table("payment_orders").insert({
        "user_id": user_id,
        "razorpay_order_id": order["id"],
        "amount": PRO_AMOUNT_PAISE,
        "currency": "INR",
        "status": "created",
    }).execute()

    return {
        "order_id": order["id"],
        "amount": PRO_AMOUNT_PAISE,
        "currency": "INR",
        "key_id": RAZORPAY_KEY_ID,
    }


# ---------------------------------------------------------------------------
# POST /subscription/verify  (called after Razorpay checkout success)
# ---------------------------------------------------------------------------

class VerifyPaymentIn(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/verify")
async def verify_payment(payload: VerifyPaymentIn, request: Request):
    """
    Verifies Razorpay payment signature.
    If valid → upgrades user to Pro plan.
    If invalid → marks order as failed, returns 400.
    """
    user_id = get_user_id_from_request(request)
    supabase = get_supabase_service_client()

    # Signature verification
    expected_signature = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        # Mark order as failed
        supabase.table("payment_orders").update({
            "status": "failed",
            "razorpay_payment_id": payload.razorpay_payment_id,
        }).eq("razorpay_order_id", payload.razorpay_order_id).execute()

        raise HTTPException(status_code=400, detail="Payment verification failed. Signature mismatch.")

    # Upgrade user to Pro
    supabase.table("subscriptions").update({
        "plan": "pro",
        "plan_selected": True,
        "credits_limit": None,          # unlimited
        "razorpay_payment_id": payload.razorpay_payment_id,
        "razorpay_subscription_id": payload.razorpay_order_id,
    }).eq("user_id", user_id).execute()

    # Mark order as paid
    supabase.table("payment_orders").update({
        "status": "paid",
        "razorpay_payment_id": payload.razorpay_payment_id,
        "razorpay_signature": payload.razorpay_signature,
    }).eq("razorpay_order_id", payload.razorpay_order_id).execute()

    return {"success": True, "plan": "pro"}