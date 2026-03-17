/**
 * Google Login Button Component
 * 
 * Clean, simple button for initiating Google OAuth login
 * Shows loading state during authentication
 * 
 * Usage:
 * <GoogleLoginButton />
 */

import React from "react";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function GoogleLoginButton() {
  const { loginWithGoogle, loading } = useGoogleAuth();

  return (
    <Button
      onClick={loginWithGoogle}
      disabled={loading}
      variant="outline"
      className="w-full"
      size="lg"
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Signing in...
        </>
      ) : (
        <>
          {/* Google Icon SVG */}
          <svg
            className="mr-2 h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <text
              x="12"
              y="16"
              textAnchor="middle"
              fontSize="14"
              fontWeight="bold"
              fill="currentColor"
            >
              G
            </text>
          </svg>
          Continue with Google
        </>
      )}
    </Button>
  );
}
