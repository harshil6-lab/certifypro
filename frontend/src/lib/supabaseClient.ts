import { createClient, type Session } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabaseUrl =
  typeof rawUrl === "string" && rawUrl.trim().length > 0
    ? rawUrl.startsWith("http")
      ? rawUrl.trim()
      : `https://${rawUrl.trim()}`
    : "";

const supabaseAnonKey =
  typeof rawAnonKey === "string" && rawAnonKey.trim().length > 0
    ? rawAnonKey.trim()
    : "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const projectRef = (() => {
  if (!supabaseUrl) {
    return "";
  }

  try {
    return new URL(supabaseUrl).hostname.split(".")[0] ?? "";
  } catch {
    return "";
  }
})();

const storageKeys = projectRef
  ? [`sb-${projectRef}-auth-token`, `sb-${projectRef}-auth-token-code-verifier`]
  : [];

const authErrorPattern = /jws protected header is invalid|jwt|refresh token|invalid refresh token|invalid claim|bad jwt/i;

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export const publicSupabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: projectRef ? `sb-${projectRef}-public-auth-token` : "sb-public-auth-token",
      },
    })
  : null;

export function isSupabaseAuthStateCorrupted(error: unknown): boolean {
  if (error instanceof Error) {
    return authErrorPattern.test(error.message);
  }

  if (typeof error === "string") {
    return authErrorPattern.test(error);
  }

  return false;
}

export async function clearStoredSupabaseSession(): Promise<void> {
  if (typeof window !== "undefined") {
    for (const key of storageKeys) {
      window.localStorage.removeItem(key);
      window.sessionStorage.removeItem(key);
    }
  }

  if (!supabase) {
    return;
  }

  await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
}

export async function getSessionSafely(): Promise<Session | null> {
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      if (isSupabaseAuthStateCorrupted(error)) {
        await clearStoredSupabaseSession();
      }

      return null;
    }

    const session = data.session ?? null;
    if (session?.access_token && session.access_token.split(".").length !== 3) {
      await clearStoredSupabaseSession();
      return null;
    }

    return session;
  } catch (error) {
    if (isSupabaseAuthStateCorrupted(error)) {
      await clearStoredSupabaseSession();
    }

    return null;
  }
}
