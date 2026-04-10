import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import {
  clearStoredSupabaseSession,
  isSupabaseConfigured,
  supabase,
} from "@/lib/supabaseClient";
import { API_BASE } from "@/services/apiService";
import { getAccessToken } from "@/utils/getAccessToken";


const AUTH_KEY = "certifypro_auth";

type AuthResult = {
  success: boolean;
  error?: string;
  firstLoginRequired?: boolean;
};

type SessionSnapshot = {
  authenticated: boolean;
  firstLoginRequired: boolean;
};

const setAuthFlag = (value: boolean) => {
  if (value) {
    localStorage.setItem(AUTH_KEY, "true");
    return;
  }

  localStorage.removeItem(AUTH_KEY);
};

const isEmailVerified = (session: Session | null): boolean => {
  return Boolean(session?.user?.email_confirmed_at);
};

const isFirstLoginRequired = (session: Session | null): boolean => {
  return Boolean(session?.user?.user_metadata?.first_login_required);
};

export function isAuthenticated(): boolean {
  return localStorage.getItem(AUTH_KEY) === "true";
}

export function setAuthenticated(value: boolean): void {
  setAuthFlag(value);

  if (!value && supabase) {
    void supabase.auth.signOut().catch(() => undefined);
  }
}

export async function initializeAuthSession(): Promise<SessionSnapshot> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      authenticated: isAuthenticated(),
      firstLoginRequired: false,
    };
  }

    try {
    const token = await getAccessToken();
    if (!token) {
      setAuthFlag(false);
      return { authenticated: false, firstLoginRequired: false };
    }

    const { data } = await supabase.auth.getSession();
    const session = data.session;

    if (!session) {
      setAuthFlag(false);
      return { authenticated: false, firstLoginRequired: false };
    }

    const verified = isEmailVerified(session);
    setAuthFlag(verified);

    return {
      authenticated: verified,
      firstLoginRequired: verified ? isFirstLoginRequired(session) : false,
    };
  } catch {

    setAuthFlag(false);
    return { authenticated: false, firstLoginRequired: false };
  }
}

export function subscribeToAuthChanges(
  callback: (
    authenticated: boolean,
    event: AuthChangeEvent,
    firstLoginRequired: boolean,
  ) => void,
): () => void {
  if (!supabase) {
    return () => undefined;
  }

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    const verified = isEmailVerified(session);
    setAuthFlag(verified);
    callback(verified, event, verified ? isFirstLoginRequired(session) : false);
  });

  return () => subscription.unsubscribe();
}

export async function signInWithEmailPassword(
  email: string,
  password: string,
): Promise<AuthResult> {
  if (!email.trim() || !password.trim()) {
    return {
      success: false,
      error: "Please enter both email and password.",
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      error: "Authentication is not configured yet. Please contact your administrator.",
    };
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setAuthFlag(false);
      return {
        success: false,
        error: error.message || "Unable to sign in. Please try again.",
      };
    }

    if (!isEmailVerified(data.session ?? null)) {
      await supabase.auth.signOut().catch(() => undefined);
      setAuthFlag(false);
      return {
        success: false,
        error: "Please verify your email address before signing in.",
      };
    }

    // Store backend JWT token if present in response
    if (data?.user?.access_token) {
      localStorage.setItem("access_token", data.user.access_token);
    }
    setAuthFlag(true);
    return {
      success: true,
      firstLoginRequired: isFirstLoginRequired(data.session ?? null),
    };
  } catch {
    setAuthFlag(false);
    return {
      success: false,
      error: "Unexpected authentication error. Please try again.",
    };
  }
}

export async function completeFirstLoginReset(): Promise<AuthResult> {
  if (!supabase) {
    return {
      success: false,
      error: "Authentication client is unavailable.",
    };
  }

  try {
    const { error } = await supabase.auth.updateUser({
      data: { first_login_required: false },
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Unable to update first-login status.",
      };
    }

    return { success: true, firstLoginRequired: false };
  } catch {
    return {
      success: false,
      error: "Unexpected error while updating first-login status.",
    };
  }
}

export async function signOutUser(): Promise<void> {
  setAuthFlag(false);
  await clearStoredSupabaseSession();
}

export async function sendPasswordResetEmail(email: string): Promise<AuthResult> {
  if (!email.trim()) {
    return {
      success: false,
      error: "Enter your account email to receive a reset link.",
    };
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      error: "Password reset is not configured yet. Please contact your administrator.",
    };
  }

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return {
        success: false,
        error: error.message || "Unable to send password reset email.",
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "Unexpected error while sending reset email.",
    };
  }
}

export { AUTH_KEY, isSupabaseConfigured };

/* ============================================================ */
/* PROFILE & FIRST LOGIN CHECK */
/* ============================================================ */

export type UserProfile = {
  id: string;
  email: string;
  role: "staff" | "admin" | "super_admin";
  organization?: string;
  full_name?: string;
  phone?: string;
  department?: string;
  designation?: string;
  institution_name?: string;
  institution_logo?: string;
  address?: string;
  domain?: string;
  created_at?: string;
  last_login_at?: string;
  notification_preferences?: {
    email_alerts?: boolean;
    security_alerts?: boolean;
  };
  first_login_required: boolean;
};

async function fetchUserProfileWithToken(token: string): Promise<Response> {
  return fetch(`${API_BASE}/user/profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

async function bootstrapMissingProfile(token: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/access-control/overview`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    return response.ok;
  } catch (error) {
    console.warn("Unable to bootstrap missing profile from access control:", error);
    return false;
  }
}

/**
 * Fetch current user's profile with role and organization.
 * Used to determine if user needs to complete profile setup.
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const token = await getAccessToken();
    if (!token) {
      throw new Error("User not authenticated");
    }

    let response = await fetchUserProfileWithToken(token);


    if (!response.ok) {
      if (response.status === 401) {
        console.warn("User not authenticated");
        return null;
      }
      if (response.status === 404) {
        const bootstrapped = await bootstrapMissingProfile(token);
        if (bootstrapped) {
          response = await fetchUserProfileWithToken(token);
        }
        if (response.status === 404) {
          console.warn("User profile not found");
          return null;
        }
      }
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    }

    const data = await response.json();
    return data.profile || null;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
}

/**
 * Check if user needs to complete first login setup.
 * Returns URL to redirect to, or null if no redirect needed.
 */
export async function checkFirstLoginRequired(): Promise<string | null> {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      console.warn("Profile not found, redirecting to complete-profile");
      return "/complete-profile";
    }

    if (profile.first_login_required) {
      console.info("First login setup required, redirecting");
      return "/complete-profile";
    }

    return null;
  } catch (error) {
    console.error("Error checking first login status:", error);
    return null;
  }
}

/**
 * Mark first login as complete and redirect user to dashboard.
 */
export async function markFirstLoginComplete(): Promise<AuthResult> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      success: false,
      error: "Authentication is not configured.",
    };
  }

  try {
        const token = await getAccessToken();

    if (!token) {
      throw new Error("User not authenticated");
    }


    const response = await fetch(`${API_BASE}/user/profile/complete-first-login`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      ...data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to complete first login",
    };
  }
}
