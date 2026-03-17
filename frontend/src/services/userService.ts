/**
 * User Service - Database validation layer for Google OAuth
 * 
 * Responsibility: Check if a user exists in the database
 * This prevents unauthorized access from Google OAuth
 * 
 * Security Note: Always validate users in the database, never trust OAuth alone
 */

import { supabase } from "@/lib/supabaseClient";

/**
 * Check if a user exists in the database by email
 * 
 * This is the CRITICAL security check for Google OAuth flows.
 * Google OAuth alone is not enough - we verify the user actually exists
 * in our system before granting access.
 * 
 * @param email - User email to validate
 * @returns boolean - true if user exists, false otherwise
 */
export async function checkUserExists(email: string): Promise<boolean> {
  if (!supabase) {
    console.error("❌ Supabase not configured");
    return false;
  }

  if (!email || !email.includes("@")) {
    console.error("❌ Invalid email format", { email });
    return false;
  }

  try {
    console.log("🔍 Checking if user exists in database", { email });

    // Query the users table for this email
    const { data, error } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .single(); // Expect exactly one result

    // If no error and we have data, user exists
    if (!error && data) {
      console.log("✅ User found in database", { email });
      return true;
    }

    // No error but no data means user doesn't exist (404 from single())
    if (error?.code === "PGRST116") {
      console.log("❌ User NOT found in database", { email });
      return false;
    }

    // Any other error is unexpected
    if (error) {
      console.error("❌ Database query error", {
        email,
        error: error.message,
        code: error.code,
      });
      return false;
    }

    // Fallback: user doesn't exist
    return false;
  } catch (err) {
    console.error("❌ Unexpected error checking user", {
      email,
      error: err instanceof Error ? err.message : String(err),
    });
    return false;
  }
}

/**
 * Get user details from database
 * 
 * Used after successful validation to fetch user information
 * 
 * @param email - User email
 * @returns User object or null
 */
export async function getUserByEmail(email: string) {
  if (!supabase) {
    console.error("❌ Supabase not configured");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

    if (error) {
      console.error("❌ Error fetching user", { email, error: error.message });
      return null;
    }

    return data;
  } catch (err) {
    console.error("❌ Unexpected error fetching user", {
      email,
      error: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}
