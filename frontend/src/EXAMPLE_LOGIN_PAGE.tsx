/**
 * EXAMPLE LOGIN PAGE WITH GOOGLE OAUTH
 * 
 * This file shows exactly how to integrate GoogleLoginButton
 * into your existing Login page.
 * 
 * Copy and adapt this to your actual Login.tsx page.
 */

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleLoginButton } from "@/components/GoogleLoginButton";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/**
 * Example Login Page with Google OAuth
 * 
 * This shows:
 * 1. Traditional email/password login
 * 2. Google OAuth option below
 * 3. Integration with your existing auth system
 */
export function ExampleLoginPageWithGoogle() {
  const navigate = useNavigate();
  const { googleUser, isGoogleLoggedIn } = useGoogleAuth();

  // Traditional login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /**
   * Auto-redirect if Google login succeeded
   * 
   * When googleUser is set, it means:
   * 1. User authenticated with Google
   * 2. User's email was found in database
   * 3. User is now logged in
   */
  useEffect(() => {
    if (isGoogleLoggedIn) {
      console.log("✅ User logged in via Google:", googleUser);

      // Sync with your main auth system if needed
      // setAuthenticated(true);

      // Redirect to dashboard
      navigate("/dashboard");
    }
  }, [isGoogleLoggedIn, googleUser]);

  /**
   * Handle traditional login
   */
  const handleTraditionalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Your existing login logic here
      // Example:
      // const result = await loginWithEmail(email, password);
      // if (result.success) {
      //   navigate("/dashboard");
      // }

      console.log("Traditional login:", { email, password });
      // TODO: Implement your login logic
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Sign in to CertifyPro
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Choose your login method below.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Login Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Error Message Display */}
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
            )}

            {/* ============================================ */}
            {/* OPTION 1: Traditional Email/Password Login  */}
            {/* ============================================ */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Email & Password
              </h3>

              <form onSubmit={handleTraditionalLogin} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Email Address
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </div>

            {/* ============================================ */}
            {/* DIVIDER                                      */}
            {/* ============================================ */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            {/* ============================================ */}
            {/* OPTION 2: Google OAuth (NEW)                */}
            {/* ============================================ */}
            <div>
              <GoogleLoginButton />
              <p className="mt-2 text-xs text-gray-500 text-center">
                Your email must be registered to log in with Google
              </p>
            </div>

            {/* ============================================ */}
            {/* FOOTER LINKS                                */}
            {/* ============================================ */}
            <div className="flex items-center justify-between text-sm">
              <a href="/reset-password" className="text-blue-600 hover:underline">
                Forgot password?
              </a>
              <a href="/signup" className="text-blue-600 hover:underline">
                Don't have an account?
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <p className="text-center text-xs text-gray-500">
          We keep your information secure. Both login methods use encrypted connections.
        </p>
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES
 * ====================
 * 
 * 1. Replace your existing login form with this example
 * 
 * 2. Update the handleTraditionalLogin function with your actual
 *    email/password logic
 * 
 * 3. Make sure GoogleAuthProvider wraps your app at the root level
 * 
 * 4. The Google button is fully self-contained:
 *    - Shows loading state
 *    - Handles OAuth redirect
 *    - Validates user in database
 *    - Shows errors automatically
 * 
 * 5. When Google login succeeds:
 *    - isGoogleLoggedIn becomes true
 *    - googleUser contains the user data
 *    - useEffect redirects to dashboard
 * 
 * 6. If you want to use single Sign-Out:
 *    - Call supabase.auth.signOut()
 *    - It will sign out from both methods
 */
