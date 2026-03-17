/**
 * Google Auth Service - Isolated Google OAuth Logic
 * 
 * Responsibility: Handle Google OAuth flow with database validation
 * 
 * IMPORTANT: This is completely separate from the existing auth system
 * Google OAuth is only for EXISTING users - NOT for signup
 * 
 * Flow:
 * 1. User clicks "Continue with Google"
 * 2. Google OAuth redirect happens
 * 3. On return, check if user exists in database
 * 4. If exists → allow login (set auth flag)
 * 5. If not exists → logout + show error message
 */

import { supabase } from "@/lib/supabaseClient";
import { checkUserExists } from "./userService";

/**
 * Type for Google Auth response
 */
export type GoogleAuthResponse = {
  success: boolean;
  error?: string;
  user?: {
    email: string;
    name?: string;
  };
};

/**
 * Initiate Google OAuth login flow
 * 
 * This triggers the OAuth redirect to Google.
 * On return, handleGoogleCallback() MUST be called.
 * 
 * SECURITY: OAuth redirect is handled by Supabase automatically
 * We validate the returned user in handleGoogleCallback()
 * 
 * @returns Promise with OAuth result
 */
export async function loginWithGoogle(): Promise<GoogleAuthResponse> {
  if (!supabase) {
    return {
      success: false,
      error: "Supabase not configured - cannot proceed with Google OAuth",
    };
  }

  try {
    console.log("🔄 Initiating Google OAuth login...");

    // Initiate Supabase Google OAuth flow
    // This will redirect user to Google login page
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Redirect to this page after OAuth succeeds
        // The session will be automatically in URL/localStorage
        redirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      console.error("❌ Google OAuth initiation failed", { error: error.message });
      return {
        success: false,
        error: `Failed to initiate Google login: ${error.message}`,
      };
    }

    console.log("✅ Google OAuth redirect initiated");
    return { success: true };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("❌ Google OAuth error", { error: errorMsg });
    return {
      success: false,
      error: `Google OAuth error: ${errorMsg}`,
    };
  }
}

/**
 * Handle Google OAuth callback
 * 
 * This is called AFTER Google redirects back to the app.
 * 
 * CRITICAL SECURITY STEP:
 * 1. Get user from Supabase session
 * 2. Check if email exists in our database
 * 3. If NOT exists → immediately logout + deny access
 * 4. If exists → allow login (don't modify - session already set by Supabase)
 * 
 * WHY THIS IS IMPORTANT:
 * - Google OAuth authenticates with Google, not our system
 * - We need to verify this user was pre-authorized in our database
 * - This prevents random Google users from accessing our system
 * 
 * @returns Promise with user validation result
 */
export async function handleGoogleCallback(): Promise<GoogleAuthResponse> {
  if (!supabase) {
    return {
      success: false,
      error: "Supabase not configured",
    };
  }

  try {
    console.log("🔍 Processing Google OAuth callback...");

    // Get the current session after OAuth redirect
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session) {
      console.error("❌ No session found after Google OAuth", {
        error: sessionError?.message,
      });
      return {
        success: false,
        error: "Session not found. Please try again.",
      };
    }

    const user = session.user;
    if (!user?.email) {
      console.error("❌ No email in Google OAuth response", { user });

      // Cleanup: logout since we can't validate
      await supabase.auth.signOut().catch(() => undefined);

      return {
        success: false,
        error: "Email not found in Google profile. Please try again.",
      };
    }

    console.log("📧 Google OAuth user email:", { email: user.email });

    // CRITICAL VALIDATION: Check if user exists in our database
    const userExists = await checkUserExists(user.email);

    if (!userExists) {
      // User authenticated with Google but NOT in our system
      // This is a potential unauthorized access attempt - DENY

      console.warn("❌ Google user NOT found in database - denying access", {
        email: user.email,
      });

      // Immediately logout this session
      await supabase.auth.signOut().catch(() => undefined);

      return {
        success: false,
        error:
          "Your email is not registered in CertifyPro. Please sign up first using the regular registration method.",
      };
    }

    // User exists in database - Google OAuth validation successful!
    console.log("✅ Google user validated in database", { email: user.email });

    return {
      success: true,
      user: {
        email: user.email,
        name: user.user_metadata?.full_name,
      },
    };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("❌ Error handling Google callback", { error: errorMsg });

    // Cleanup on error
    await supabase.auth.signOut().catch(() => undefined);

    return {
      success: false,
      error: `Authentication failed: ${errorMsg}`,
    };
  }
}

/**
 * Check if we're in a Google OAuth callback
 * 
 * Supabase automatically processes OAuth and sets session in URL/localStorage.
 * This checks if we just completed an OAuth flow.
 * 
 * @returns boolean - true if this might be an OAuth callback
 */
export function isPossibleOAuthCallback(): boolean {
  // Check if URL has auth parameters from Supabase
  const params = new URLSearchParams(window.location.hash.substring(1));
  return params.has("access_token") || params.has("refresh_token");
}
