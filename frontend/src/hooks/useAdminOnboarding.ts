import { useState, useEffect } from "react";

export interface OnboardingProfile {
  role: string;
  organization: string;
  discoveredVia: string;
  intendedUse: string;
  completedAt: string;
}

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
        const data = JSON.parse(stored);
        setProfile(data);
        setIsCompleted(true);
      } catch {
        // Invalid JSON, treat as not completed
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
