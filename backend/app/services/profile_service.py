"""Profile service - manages user profiles and authorization."""

import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any

from ..core.supabase_client import supabase

logger = logging.getLogger(__name__)


def _safe_dict(value: Any) -> Dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _read_profile_metadata(profile_data: Dict[str, Any]) -> Dict[str, Any]:
    metadata = _safe_dict(profile_data.get("metadata"))
    profile_metadata = _safe_dict(metadata.get("profile"))
    notifications = _safe_dict(metadata.get("notification_preferences"))

    organization = (
        profile_metadata.get("organization")
        or metadata.get("organization")
        or profile_data.get("organization")
        or ""
    )

    institution_name = (
        profile_metadata.get("institution_name")
        or metadata.get("institution_name")
        or organization
    )

    return {
        "organization": organization,
        "phone": profile_metadata.get("phone") or "",
        "department": profile_metadata.get("department") or "",
        "designation": profile_metadata.get("designation") or "",
        "institution_name": institution_name or "",
        "institution_logo": (
            profile_metadata.get("institution_logo")
            or metadata.get("institution_logo")
            or ""
        ),
        "address": profile_metadata.get("address") or metadata.get("address") or "",
        "domain": profile_metadata.get("domain") or metadata.get("domain") or "",
        "email_alerts": bool(notifications.get("email_alerts", False)),
        "security_alerts": bool(notifications.get("security_alerts", False)),
        "onboarding_completed_at": metadata.get("onboarding_completed_at"),
    }


def get_user_profile(user_id: Optional[str]) -> Optional[Dict[str, Any]]:
    """
    Fetch the profile for the current authenticated user.
    
    Args:
        user_id: The user ID from Supabase Auth
        
    Returns:
        Profile dict with id, email, role, organization, first_login_required, created_at
        or None if not found or error occurs
        
    Raises:
        Logs errors but does not raise - returns None on failure for graceful degradation
    """
    # Input validation
    if not user_id or not isinstance(user_id, str):
        logger.warning(f"[get_user_profile] Invalid user_id: {user_id}")
        return None
    
    # Check if Supabase client is available
    if not supabase:
        logger.error("[get_user_profile] Supabase client unavailable")
        return None
    
    try:
        logger.info(f"[get_user_profile] Fetching profile for user: {user_id}")
        
        # Query app_users table
        response = (
            supabase.table("app_users")
            .select("*")
            .eq("auth_uid", user_id)
            .maybeSingle()
            .execute()
        )
        
        # Check for errors in response
        if hasattr(response, "error") and response.error:
            logger.warning(f"[get_user_profile] Query error for user {user_id}: {response.error}")
            return None
        
        # Check if data exists
        if not hasattr(response, "data") or not response.data:
            logger.debug(f"[get_user_profile] No profile found for user: {user_id}")
            return None
        
        # Extract and validate profile data
        profile_data = response.data
        metadata_fields = _read_profile_metadata(profile_data)
        profile = {
            "id": profile_data.get("auth_uid"),
            "email": profile_data.get("email"),
            "full_name": profile_data.get("full_name"),
            "role": profile_data.get("role", "staff"),
            "created_at": profile_data.get("created_at"),
            "organization": metadata_fields["organization"],
            "phone": metadata_fields["phone"],
            "department": metadata_fields["department"],
            "designation": metadata_fields["designation"],
            "institution_name": metadata_fields["institution_name"],
            "institution_logo": metadata_fields["institution_logo"],
            "address": metadata_fields["address"],
            "domain": metadata_fields["domain"],
            "notification_preferences": {
                "email_alerts": metadata_fields["email_alerts"],
                "security_alerts": metadata_fields["security_alerts"],
            },
            "first_login_required": not bool(metadata_fields["onboarding_completed_at"]),
        }
        
        # Validate required fields
        if not profile.get("id") or not profile.get("email"):
            logger.error(f"[get_user_profile] Invalid profile data (missing required fields): {user_id}")
            return None
        
        logger.debug(f"[get_user_profile] Successfully fetched app_users profile for {user_id}")
        return profile
        
    except Exception as e:
        logger.exception(f"[get_user_profile] Unexpected error fetching profile for {user_id}: {type(e).__name__}: {str(e)}")
        return None


def mark_first_login_complete(user_id: Optional[str]) -> bool:
    """
    Mark onboarding as complete for a user by updating metadata.
    
    Args:
        user_id: The user ID from Supabase Auth
        
    Returns:
        True if successful, False otherwise
    """
    # Input validation
    if not user_id or not isinstance(user_id, str):
        logger.warning(f"[mark_first_login_complete] Invalid user_id: {user_id}")
        return False
    
    # Check if Supabase client is available
    if not supabase:
        logger.error("[mark_first_login_complete] Supabase client unavailable")
        return False
    
    try:
        logger.info(f"[mark_first_login_complete] Marking onboarding complete for user: {user_id}")

        existing_profile = (
            supabase.table("app_users")
            .select("metadata")
            .eq("auth_uid", user_id)
            .maybeSingle()
            .execute()
        )
        existing_metadata = {}
        if hasattr(existing_profile, "data") and existing_profile.data:
            metadata = existing_profile.data.get("metadata")
            if isinstance(metadata, dict):
                existing_metadata = metadata
        
        # Update app_users metadata to mark onboarding as complete
        response = (
            supabase.table("app_users")
            .update({
                "metadata": {
                    **existing_metadata,
                    "onboarding_completed_at": datetime.now(timezone.utc).isoformat(),
                }
            })
            .eq("auth_uid", user_id)
            .select()
            .execute()
        )
        
        # Check for errors in response
        if hasattr(response, "error") and response.error:
            logger.error(f"[mark_first_login_complete] Update error for user {user_id}: {response.error}")
            return False
        
        # Verify update was successful
        if not hasattr(response, "data") or not response.data:
            logger.warning(f"[mark_first_login_complete] No rows updated for user: {user_id}")
            return False
        
        logger.info(f"✅ [mark_first_login_complete] Successfully completed for user {user_id}")
        return True
        
    except Exception as e:
        logger.exception(f"[mark_first_login_complete] Unexpected error for user {user_id}: {type(e).__name__}: {str(e)}")
        return False


def update_user_profile(user_id: Optional[str], updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Persist editable profile fields while preserving unrelated metadata."""
    if not user_id or not isinstance(user_id, str):
        logger.warning(f"[update_user_profile] Invalid user_id: {user_id}")
        return None

    if not isinstance(updates, dict):
        logger.warning("[update_user_profile] Invalid updates payload")
        return None

    if not supabase:
        logger.error("[update_user_profile] Supabase client unavailable")
        return None

    try:
        existing_profile = (
            supabase.table("app_users")
            .select("full_name, metadata")
            .eq("auth_uid", user_id)
            .maybeSingle()
            .execute()
        )

        if not hasattr(existing_profile, "data") or not existing_profile.data:
            logger.warning(f"[update_user_profile] No profile found for user: {user_id}")
            return None

        current_data = existing_profile.data
        existing_metadata = _safe_dict(current_data.get("metadata"))
        existing_profile_metadata = _safe_dict(existing_metadata.get("profile"))
        existing_notifications = _safe_dict(existing_metadata.get("notification_preferences"))

        full_name = updates.get("full_name")
        if not isinstance(full_name, str) or not full_name.strip():
            full_name = current_data.get("full_name") or ""

        submitted_institution_name = updates.get("institution_name", existing_profile_metadata.get("institution_name", ""))
        submitted_organization = updates.get(
            "organization",
            existing_profile_metadata.get("organization") or existing_metadata.get("organization") or "",
        )
        canonical_organization = submitted_institution_name or submitted_organization

        normalized_updates = {
            "phone": updates.get("phone", existing_profile_metadata.get("phone", "")),
            "department": updates.get("department", existing_profile_metadata.get("department", "")),
            "designation": updates.get("designation", existing_profile_metadata.get("designation", "")),
            "institution_name": canonical_organization,
            "institution_logo": updates.get("institution_logo", existing_profile_metadata.get("institution_logo", "")),
            "address": updates.get("address", existing_profile_metadata.get("address", "")),
            "domain": updates.get("domain", existing_profile_metadata.get("domain", "")),
            "organization": canonical_organization,
        }

        sanitized_profile_metadata = {
            key: value.strip() if isinstance(value, str) else ""
            for key, value in normalized_updates.items()
        }

        notification_updates = _safe_dict(updates.get("notification_preferences"))
        merged_notifications = {
            **existing_notifications,
            "email_alerts": bool(notification_updates.get("email_alerts", existing_notifications.get("email_alerts", False))),
            "security_alerts": bool(notification_updates.get("security_alerts", existing_notifications.get("security_alerts", False))),
        }

        merged_metadata = {
            **existing_metadata,
            "organization": sanitized_profile_metadata["organization"],
            "profile": {
                **existing_profile_metadata,
                **sanitized_profile_metadata,
            },
            "notification_preferences": merged_notifications,
        }

        response = (
            supabase.table("app_users")
            .update({
                "full_name": full_name.strip(),
                "metadata": merged_metadata,
            })
            .eq("auth_uid", user_id)
            .execute()
        )

        if hasattr(response, "error") and response.error:
            logger.error(f"[update_user_profile] Update error for user {user_id}: {response.error}")
            return None

        return get_user_profile(user_id)
    except Exception as e:
        logger.exception(f"[update_user_profile] Unexpected error for user {user_id}: {type(e).__name__}: {str(e)}")
        return None


def get_user_role(user_id: Optional[str]) -> Optional[str]:
    """
    Get the role for a user.
    
    Args:
        user_id: The user ID from Supabase Auth
        
    Returns:
        User role ('staff', 'admin', 'super_admin') or None if not found
    """
    if not user_id:
        logger.debug("[get_user_role] No user_id provided")
        return None
    
    try:
        profile = get_user_profile(user_id)
        if not profile:
            return None
        
        role = profile.get("role")
        if role not in ("staff", "admin", "super_admin"):
            logger.warning(f"[get_user_role] Invalid role for user {user_id}: {role}")
            return None
        
        return role
        
    except Exception as e:
        logger.exception(f"[get_user_role] Error getting role for user {user_id}: {type(e).__name__}: {str(e)}")
        return None


def is_admin(user_id: Optional[str]) -> bool:
    """
    Check if user is admin or super_admin.
    
    Args:
        user_id: The user ID from Supabase Auth
        
    Returns:
        True if user is admin or super_admin, False otherwise
    """
    if not user_id:
        return False
    
    try:
        role = get_user_role(user_id)
        is_authorized = role in ("admin", "super_admin")
        
        if is_authorized:
            logger.debug(f"[is_admin] User {user_id} is authorized (role: {role})")
        
        return is_authorized
        
    except Exception as e:
        logger.exception(f"[is_admin] Error checking admin status for user {user_id}: {type(e).__name__}: {str(e)}")
        return False


def get_user_organization(user_id: Optional[str]) -> Optional[str]:
    """
    Get the organization for a user.
    
    Args:
        user_id: The user ID from Supabase Auth
        
    Returns:
        Organization name or None if not found
    """
    if not user_id:
        logger.debug("[get_user_organization] No user_id provided")
        return None
    
    try:
        profile = get_user_profile(user_id)
        if not profile:
            return None
        
        org = profile.get("organization")
        if org and isinstance(org, str):
            logger.debug(f"[get_user_organization] Organization for user {user_id}: {org}")
            return org
        
        logger.debug(f"[get_user_organization] No organization found for user {user_id}")
        return None
        
    except Exception as e:
        logger.exception(f"[get_user_organization] Error getting organization for user {user_id}: {type(e).__name__}: {str(e)}")
        return None
