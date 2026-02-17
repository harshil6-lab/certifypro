import { useState, useEffect } from "react";

export interface OnboardingProfile {
  role: string;
  organization: string;
  discoveredVia: string;
  intendedUse: string;
  completedAt: string;
}

interface OnboardingSkipped {
  skipped: true;
  skippedAt: string;
}

const isCompletedProfile = (data: unknown): data is OnboardingProfile => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const value = data as Record<string, unknown>;
  return (
    typeof value.role === "string" &&
    typeof value.organization === "string" &&
    typeof value.discoveredVia === "string" &&
    typeof value.intendedUse === "string" &&
    typeof value.completedAt === "string"
  );
};

const isSkippedProfile = (data: unknown): data is OnboardingSkipped => {
  if (!data || typeof data !== "object") {
    return false;
  }

  const value = data as Record<string, unknown>;
  return value.skipped === true && typeof value.skippedAt === "string";
};

const ONBOARDING_KEY = "certifypro_admin_onboarding";

export function useAdminOnboarding() {
  const [isCompleted, setIsCompleted] = useState(false);
  const [profile, setProfile] = useState<OnboardingProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load onboarding status on mount
  useEffect(() => {
    const stored = localStorage.getItem(ONBOARDING_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored) as unknown;

        if (isCompletedProfile(data)) {
          setProfile(data);
          setIsCompleted(true);
        } else if (isSkippedProfile(data)) {
          setProfile(null);
          setIsCompleted(true);
        } else {
          localStorage.removeItem(ONBOARDING_KEY);
          setIsCompleted(false);
        }
      } catch {
        localStorage.removeItem(ONBOARDING_KEY);
        setIsCompleted(false);
      }
    }
    setIsLoading(false);
  }, []);

  const completeOnboarding = (data: Omit<OnboardingProfile, "completedAt">) => {
    const profileData: OnboardingProfile = {
      ...data,
      completedAt: new Date().toISOString(),
    };
    setProfile(profileData);
    setIsCompleted(true);
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(profileData));
  };

  const skipOnboarding = () => {
    // Mark as "intentionally skipped" by setting a flag
    const skipData = {
      skipped: true,
      skippedAt: new Date().toISOString(),
    };
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(skipData));
    setIsCompleted(true);
    setProfile(null);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(ONBOARDING_KEY);
    setProfile(null);
    setIsCompleted(false);
  };

  return {
    isCompleted,
    profile,
    isLoading,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  };
}
