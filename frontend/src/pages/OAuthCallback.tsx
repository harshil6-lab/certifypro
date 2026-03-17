/**
 * OAuth Callback Handler Page
 * 
 * THIS PAGE IS CRITICAL FOR GOOGLE OAUTH FLOW
 * 
 * When user completes Google login:
 * 1. Google redirects to this page
 * 2. We extract the OAuth tokens from URL
 * 3. We validate user exists in our database
 * 4. We redirect to dashboard if valid, else back to login
 * 
 * Flow:
 * User clicks "Continue with Google"
 *   → Redirects to Google login
 *   → User authorizes
 *   → Google redirects to THIS PAGE (/auth/callback)
 *   → We validate + handle callback
 *   → Redirect to /dashboard or /login
 */

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { handleGoogleCallback } from "@/services/googleAuthService";
import { supabase } from "@/lib/supabaseClient";

/**
 * OAuthCallback Component
 * 
 * Shows loading spinner while processing OAuth callback
 * Then redirects to appropriate page
 */
export default function OAuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<"processing" | "error" | "success">(
    "processing"
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    /**
     * Process the OAuth callback
     * This runs once when page loads after OAuth redirect
     */
    async function processCallback() {
      try {
        console.log("🔐 OAuthCallback: Starting callback processing...");

        // Detect auth type (hash or query). This centralizes handling for
        // magiclink and recovery, and logs the events for debugging.
        console.log("Auth callback triggered");

        const rawHash = typeof window !== "undefined" && window.location.hash.startsWith("#")
          ? window.location.hash.slice(1)
          : typeof window !== "undefined"
            ? window.location.hash
            : "";
        const hashParams = new URLSearchParams(rawHash);
        const queryParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
        const authType = hashParams.get("type") || queryParams.get("type");
        const accessToken = hashParams.get("access_token") || queryParams.get("access_token");

        console.log("Auth type:", authType, { accessToken: accessToken ? "present" : "none" });

        if (authType === "recovery") {
          console.log("Redirecting to reset page");
          navigate("/reset-password", { replace: true });
          return;
        }

        if (authType === "magiclink") {
          console.log("Magiclink callback detected — verifying session...");
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.error("Session error on magiclink:", sessionError);
            setErrorMessage("Invalid or expired link. Please try again.");
            setStatus("error");
            setTimeout(() => navigate("/login"), 2000);
            return;
          }

          if (!session) {
            console.warn("No session after magiclink — redirecting to login");
            setErrorMessage("Invalid or expired link. Please try again.");
            setStatus("error");
            setTimeout(() => navigate("/login"), 2000);
            return;
          }

          console.log("Redirecting to dashboard");
          setStatus("success");
          setTimeout(() => navigate("/dashboard"), 300);
          return;
        }

        // Get the current session (Supabase auto-handles OAuth tokens)
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Session error:", sessionError);
          setErrorMessage("Failed to retrieve session. Please try again.");
          setStatus("error");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        if (!session) {
          console.log("⚠️  No session found - OAuth may have been cancelled");
          setErrorMessage("Login cancelled or session expired.");
          setStatus("error");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        console.log("✅ Session found, user:", session.user.email);

        // CRITICAL: Validate user in database
        console.log("🔍 Validating user in database...");
        const result = await handleGoogleCallback();

        if (!result.success) {
          console.error("❌ Database validation failed:", result.error);
          setErrorMessage(result.error || "User validation failed.");
          setStatus("error");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }

        console.log("✅ User validated successfully!");
        setStatus("success");

        // Redirect to dashboard
        console.log("➡️  Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error("❌ Callback processing error:", errorMsg);
        setErrorMessage("An unexpected error occurred. Redirecting...");
        setStatus("error");
        setTimeout(() => navigate("/login"), 2000);
      }
    }

    processCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary/5">
      <div className="w-full max-w-md space-y-8 px-6 py-8 text-center">
        {/* Logo or branding */}
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
            <Loader2
              className={`w-8 h-8 ${
                status === "processing" ? "animate-spin" : ""
              } ${
                status === "success"
                  ? "text-green-500"
                  : status === "error"
                    ? "text-destructive"
                    : "text-accent"
              }`}
            />
          </div>
        </div>

        {/* Status message */}
        <div className="space-y-2">
          {status === "processing" && (
            <>
              <h2 className="text-2xl font-bold text-foreground">
                Completing Sign In
              </h2>
              <p className="text-muted-foreground">
                Please wait while we verify your credentials...
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <h2 className="text-2xl font-bold text-green-600">Success!</h2>
              <p className="text-muted-foreground">
                Redirecting to your dashboard...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <h2 className="text-2xl font-bold text-destructive">
                Sign In Failed
              </h2>
              <p className="text-muted-foreground">{errorMessage}</p>
              <p className="text-xs text-muted-foreground/60 pt-4">
                Redirecting to login page...
              </p>
            </>
          )}
        </div>

        {/* Debug info (only in development) */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-8 p-4 bg-secondary/50 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground text-left">
              <strong>Debug:</strong> Status = {status}
              <br />
              <strong>URL:</strong> {window.location.href}
              <br />
              <strong>Hash:</strong> {window.location.hash.substring(0, 50)}
              ...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
