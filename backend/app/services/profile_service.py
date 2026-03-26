"""Profile service - manages user profiles and authorization."""

import logging
from typing import Optional, Dict, Any

from ..core.supabase_client import supabase

logger = logging.getLogger(__name__)


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
        metadata = profile_data.get("metadata") or {}
        profile = {
            "id": profile_data.get("auth_uid"),
            "email": profile_data.get("email"),
            "full_name": profile_data.get("full_name"),
            "role": profile_data.get("role", "staff"),
            "organization": metadata.get("organization"),
            "created_at": profile_data.get("created_at"),
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
            .update({"metadata": {**existing_metadata, "onboarding_completed_at": "now()"}})
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
