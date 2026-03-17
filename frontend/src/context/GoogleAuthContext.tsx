/**
 * Google Auth Context
 * 
 * Manages Google OAuth state completely separate from main auth
 * Does NOT interfere with existing authentication system
 * 
 * State:
 * - googleUser: The validated Google user (only if DB validation passed)
 * - loading: Whether Google auth is in progress
 */

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  loginWithGoogle,
  handleGoogleCallback,
  isPossibleOAuthCallback,
  type GoogleAuthResponse,
} from "@/services/googleAuthService";
import {
  showUserNotFoundError,
  showGoogleAuthError,
  showGoogleAuthSuccess,
} from "@/utils/notifications";

/**
 * Type for validated Google user
 * Only contains info after database validation succeeds
 */
type GoogleUser = {
  email: string;
  name?: string;
};

/**
 * Context type for Google Auth
 */
type GoogleAuthContextType = {
  googleUser: GoogleUser | null;
  loading: boolean;
  initiateGoogleLogin: () => Promise<void>;
  handleCallback: () => Promise<void>;
  clearGoogleUser: () => void;
};

// Create context with undefined default
const GoogleAuthContext = createContext<GoogleAuthContextType | undefined>(
  undefined
);

/**
 * Google Auth Provider Component
 * 
 * Wrap your app routes with this provider to enable Google OAuth
 * 
 * Example:
 * <GoogleAuthProvider>
 *   <Routes />
 * </GoogleAuthProvider>
 */
export function GoogleAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [googleUser, setGoogleUser] = useState<GoogleUser | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Initiate Google Login
   * 
   * Shows loading state and triggers OAuth redirect
   */
  const initiateGoogleLogin = useCallback(async () => {
    setLoading(true);

    try {
      const result = await loginWithGoogle();

      if (!result.success) {
        showGoogleAuthError(result.error);
        setLoading(false);
        return;
      }

      // loginWithGoogle() redirects, so loading state continues
      // Handler will be called after OAuth redirect
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showGoogleAuthError(errorMsg);
      setLoading(false);
    }
  }, []);

  /**
   * Handle Google OAuth Callback
   * 
   * This is called after Google redirects back to app
   * Validates user in database and sets googleUser if successful
   */
  const handleCallback = useCallback(async () => {
    if (!isPossibleOAuthCallback()) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const result = await handleGoogleCallback();

      if (result.success && result.user) {
        // Validation passed - set the user
        setGoogleUser(result.user);
        showGoogleAuthSuccess(result.user.name);
      } else {
        // Validation failed - user not in database
        clearGoogleUser();

        // Show specific error message
        if (
          result.error?.includes("not registered") ||
          result.error?.includes("sign up")
        ) {
          showUserNotFoundError();
        } else {
          showGoogleAuthError(result.error);
        }
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      showGoogleAuthError(errorMsg);
      clearGoogleUser();
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Clear Google user (logout)
   */
  const clearGoogleUser = useCallback(() => {
    setGoogleUser(null);
  }, []);

  const value: GoogleAuthContextType = {
    googleUser,
    loading,
    initiateGoogleLogin,
    handleCallback,
    clearGoogleUser,
  };

  return (
    <GoogleAuthContext.Provider value={value}>
      {children}
    </GoogleAuthContext.Provider>
  );
}

/**
 * Hook to use Google Auth Context
 * 
 * Must be inside GoogleAuthProvider
 * 
 * Usage:
 * const { googleUser, loading, initiateGoogleLogin } = useGoogleAuth();
 * 
 * @throws Error if used outside GoogleAuthProvider
 */
export function useGoogleAuth(): GoogleAuthContextType {
  const context = useContext(GoogleAuthContext);

  if (!context) {
    throw new Error(
      "useGoogleAuth must be used inside <GoogleAuthProvider>. " +
        "Make sure to wrap your app or route with <GoogleAuthProvider>."
    );
  }

  return context;
}
