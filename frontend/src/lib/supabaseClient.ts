import { createClient } from "@supabase/supabase-js";

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

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
