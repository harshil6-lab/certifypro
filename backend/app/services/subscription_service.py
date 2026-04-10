"""
Subscription service — credit checking and deduction for CertifyPro.
"""

from ..core.supabase_client import get_supabase_service_client


def check_and_deduct_credit(user_id: str) -> dict:
    """
    Checks if user can generate a certificate.
    For free plan: checks credits_used < credits_limit, then deducts 1 credit.
    For pro plan: always allows.

    Returns:
      { "allowed": True }
      { "allowed": False, "reason": "credits_exhausted", "credits_used": 12, "credits_limit": 12 }
      { "allowed": False, "reason": "subscription_not_found" }
    """
    supabase = get_supabase_service_client()
    result = supabase.table("subscriptions").select("*").eq("user_id", user_id).single().execute()

    if not result.data:
        return {"allowed": False, "reason": "subscription_not_found"}

    sub = result.data

    if sub["plan"] == "pro":
        return {"allowed": True}

    # Free plan
    credits_used = sub["credits_used"]
    credits_limit = sub["credits_limit"] or 12

    if credits_used >= credits_limit:
        return {
            "allowed": False,
            "reason": "credits_exhausted",
            "credits_used": credits_used,
            "credits_limit": credits_limit,
        }

    # Deduct 1 credit
    supabase.table("subscriptions").update({
        "credits_used": credits_used + 1,
    }).eq("user_id", user_id).execute()

    return {"allowed": True, "credits_remaining": credits_limit - credits_used - 1}