import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { checkFirstLoginRequired, markFirstLoginComplete, getCurrentUserProfile } from "@/lib/auth";
import type { UserProfile } from "@/lib/auth";
import { Loader2 } from "lucide-react";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const initPage = async () => {
      try {
        setLoading(true);
        
        // Check if first login is actually required
        const redirectUrl = await checkFirstLoginRequired();
        if (!redirectUrl) {
          // User doesn't need first login setup, redirect to dashboard
          navigate("/dashboard", { replace: true });
          return;
        }

        // Fetch user profile
        const userProfile = await getCurrentUserProfile();
        if (!userProfile) {
          setError("Failed to load your profile. Please try again.");
          return;
        }

        setProfile(userProfile);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [navigate]);

  const handleCompletSetup = async () => {
    try {
      setSubmitting(true);
      setError(null);

      const result = await markFirstLoginComplete();
      if (result.success) {
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.error || "Failed to complete setup");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2">
          <CardTitle>Welcome to CertifyPro</CardTitle>
          <CardDescription>Complete your profile setup to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          )}

          {profile && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-sm text-gray-900 font-mono">{profile.email}</p>
              </div>

              {profile.organization && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Organization</label>
                  <p className="mt-1 text-sm text-gray-900">{profile.organization}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700">Role</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {profile.role === "super_admin" ? "Super Admin" : profile.role}
                </p>
              </div>

              <div className="rounded-md bg-blue-50 p-4 space-y-2">
                <p className="text-sm font-medium text-blue-900">What's next?</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Complete your profile settings</li>
                  <li>Configure your organization details</li>
                  <li>Upload certificate templates</li>
                  <li>Start managing students</li>
                </ul>
              </div>
            </div>
          )}

          <Button
            onClick={handleCompletSetup}
            disabled={submitting}
            className="w-full"
            size="lg"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up...
              </>
            ) : (
              "Get Started"
            )}
          </Button>

          <p className="text-xs text-gray-600 text-center">
            You can update your profile settings anytime in the profile section.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
