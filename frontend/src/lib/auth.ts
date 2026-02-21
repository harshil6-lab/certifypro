import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

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
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      setAuthFlag(false);
      return { authenticated: false, firstLoginRequired: false };
    }

    const verified = isEmailVerified(data.session ?? null);
    setAuthFlag(verified);

    return {
      authenticated: verified,
      firstLoginRequired: verified ? isFirstLoginRequired(data.session ?? null) : false,
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

  if (!supabase) {
    return;
  }

  try {
    await supabase.auth.signOut();
  } catch {
    return;
  }
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
      redirectTo: `${window.location.origin}/login`,
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
