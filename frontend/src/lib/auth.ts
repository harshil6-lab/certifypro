import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { checkUserExists } from "@/services/userService";

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

    const session = data.session ?? null;
    const verified = isEmailVerified(session);

    // Post-login re-validation: ensure the authenticated email exists in our DB
    if (session?.user?.email) {
      try {
        console.log("🔐 Post-login: validating user in database", { email: session.user.email });
        const exists = await checkUserExists(session.user.email);
        if (!exists) {
          console.warn("❌ Post-login validation failed - signing out", { email: session.user.email });
          await supabase.auth.signOut().catch(() => undefined);
          setAuthFlag(false);
          return { authenticated: false, firstLoginRequired: false };
        }

        console.log("✅ Post-login validation passed", { email: session.user.email });
      } catch (err) {
        console.error("❌ Error during post-login validation", { error: err instanceof Error ? err.message : String(err) });
        // On validation error, be conservative and sign out
        await supabase.auth.signOut().catch(() => undefined);
        setAuthFlag(false);
        return { authenticated: false, firstLoginRequired: false };
      }
    }

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
    (async () => {
      const verified = isEmailVerified(session);

      // Post-login validation on relevant events
      if (event === "SIGNED_IN" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED") {
        const email = session?.user?.email;
        if (email) {
          console.log("🔐 Auth event:", event, { email });
          try {
            const exists = await checkUserExists(email);
            if (!exists) {
              console.warn("❌ Post-login validation failed on auth change - signing out", { email, event });
              await supabase.auth.signOut().catch(() => undefined);
              setAuthFlag(false);
              callback(false, event, false);
              return;
            }

            console.log("✅ Post-login validation success on auth change", { email, event });
            setAuthFlag(verified);
            callback(verified, event, verified ? isFirstLoginRequired(session) : false);
            return;
          } catch (err) {
            console.error("❌ Error during auth-change validation", { error: err instanceof Error ? err.message : String(err) });
            await supabase.auth.signOut().catch(() => undefined);
            setAuthFlag(false);
            callback(false, event, false);
            return;
          }
        }
      }

      setAuthFlag(verified);
      callback(verified, event, verified ? isFirstLoginRequired(session) : false);
    })();
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
