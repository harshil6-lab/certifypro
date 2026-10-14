import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SectionCard } from "@/components/SectionCard";
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
      <div className="min-h-screen grid place-items-center bg-background">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary mb-4" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <SectionCard
        className="w-full max-w-md"
        title="Welcome to CertifyPro"
        description="Complete your profile setup to get started"
      >
        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Setup failed</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {profile && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="mt-1 text-sm text-muted-foreground font-mono">{profile.email}</p>
              </div>

              {profile.organization && (
                <div>
                  <p className="text-sm font-medium text-foreground">Organization</p>
                  <p className="mt-1 text-sm text-muted-foreground">{profile.organization}</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-foreground">Role</p>
                <p className="mt-1 text-sm text-muted-foreground capitalize">
                  {profile.role === "super_admin" ? "Super Admin" : profile.role}
                </p>
              </div>

              <div className="rounded-md border border-info/40 bg-info/10 p-4 space-y-2">
                <p className="text-sm font-medium text-foreground">What's next?</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
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
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Setting up...
              </>
            ) : (
              "Get Started"
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You can update your profile settings anytime in the profile section.
          </p>
        </div>
      </SectionCard>
    </div>
  );
}
