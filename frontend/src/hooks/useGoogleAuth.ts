/**
 * useGoogleAuth Hook
 * 
 * Custom React hook for using Google OAuth
 * 
 * This is a convenience wrapper around useGoogleAuth from context
 * Provides clean abstraction for components
 * 
 * Usage Example:
 * ============
 * const { googleUser, loading, loginWithGoogle } = useGoogleAuth();
 * 
 * return (
 *   <button onClick={loginWithGoogle} disabled={loading}>
 *     {loading ? "Signing in..." : "Continue with Google"}
 *   </button>
 * );
 */

import { useEffect } from "react";
import { useGoogleAuth as useGoogleAuthContext } from "@/context/GoogleAuthContext";

/**
 * Hook for Google Authentication
 * 
 * @returns Object with:
 *   - loginWithGoogle: Function to initiate Google login
 *   - googleUser: Validated user from database (null if not logged in)
 *   - loading: Whether login is in progress
 *   - isGoogleLoggedIn: Convenience boolean
 */
export function useGoogleAuth() {
  const context = useGoogleAuthContext();

  // Auto-handle callback on mount (for OAuth redirect handling)
  useEffect(() => {
    context.handleCallback();
  }, []);

  return {
    loginWithGoogle: context.initiateGoogleLogin,
    googleUser: context.googleUser,
    loading: context.loading,
    isGoogleLoggedIn: context.googleUser !== null,
  };
}
