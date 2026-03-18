"""User-related business logic.

Thin wrapper for future DB logic. Keeps interface stable for routes.
"""

def get_user_profile(user_id: str) -> dict:
    """Return a placeholder profile for `user_id`.

    Replace with real DB logic in future iterations.
    """
    return {
        "id": user_id,
        "email": None,
        "role": "user",
        "note": "Placeholder profile; implement DB-backed logic",
    }
