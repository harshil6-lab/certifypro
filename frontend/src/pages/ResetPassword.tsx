import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle2, KeyRound, Loader2, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";

const MIN_PASSWORD_LENGTH = 8;

const getRecoveryTypeFromUrl = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const hash = window.location.hash.startsWith("#")
    ? window.location.hash.slice(1)
    : window.location.hash;
  const hashParams = new URLSearchParams(hash);
  const queryParams = new URLSearchParams(window.location.search);

  return hashParams.get("type") || queryParams.get("type");
};

const mapSupabaseUpdateError = (message: string): string => {
  const lower = message.toLowerCase();

  if (lower.includes("same as old password")) {
    return "Use a new password that is different from your previous password.";
  }

  if (lower.includes("password") && lower.includes("short")) {
    return `Password too short. Use at least ${MIN_PASSWORD_LENGTH} characters.`;
  }

  if (lower.includes("jwt") || lower.includes("expired") || lower.includes("invalid") || lower.includes("session")) {
    return "Invalid or expired reset link.";
  }

  if (lower.includes("network") || lower.includes("fetch") || lower.includes("failed to fetch")) {
    return "Network error. Please check your connection and try again.";
  }

  return message;
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [invalidLinkError, setInvalidLinkError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const passwordTooShort = newPassword.length > 0 && newPassword.length < MIN_PASSWORD_LENGTH;
  const passwordMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const canSubmit = useMemo(() => {
    return (
      !submitting &&
      !passwordTooShort &&
      !passwordMismatch &&
      newPassword.length >= MIN_PASSWORD_LENGTH &&
      confirmPassword.length >= MIN_PASSWORD_LENGTH
    );
  }, [submitting, passwordTooShort, passwordMismatch, newPassword, confirmPassword]);

  useEffect(() => {
    let mounted = true;

    const initialRecoveryIntent = getRecoveryTypeFromUrl() === "recovery";

    const boot = async () => {
      if (!isSupabaseConfigured || !supabase) {
        if (mounted) {
          setInvalidLinkError("Password reset is not configured. Please contact your administrator.");
          setLoading(false);
        }
        return;
      }

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) {
          return;
        }

        if (error) {
          setInvalidLinkError("Invalid or expired reset link.");
          setLoading(false);
          return;
        }

        const hasSession = Boolean(data.session);
        if (hasSession && initialRecoveryIntent) {
          setIsRecoverySession(true);
          setLoading(false);
          return;
        }

        if (hasSession && !initialRecoveryIntent) {
          setIsRecoverySession(false);
          setLoading(false);
          return;
        }

        setInvalidLinkError("Invalid or expired reset link.");
        setLoading(false);
      } catch {
        if (mounted) {
          setInvalidLinkError("Network error. Please check your connection and try again.");
          setLoading(false);
        }
      }
    };

    void boot();

    const {
      data: { subscription },
    } = supabase
        ? supabase.auth.onAuthStateChange((event, session) => {
          if (!mounted) {
            return;
          }

          if (event === "PASSWORD_RECOVERY" && session) {
            setIsRecoverySession(true);
            setInvalidLinkError("");
            setLoading(false);
            return;
          }

          if (!session && event === "SIGNED_OUT") {
            setIsRecoverySession(false);
          }
        })
        : { data: { subscription: { unsubscribe: () => undefined } } };

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async () => {
    setSubmitError("");
    setSubmitSuccess("");

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setSubmitError(`Password too short. Use at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setSubmitError("Passwords do not match.");
      return;
    }

    if (!supabase) {
      setSubmitError("Password reset is unavailable right now. Please contact your administrator.");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setSubmitError(mapSupabaseUpdateError(error.message || "Unable to update password."));
        return;
      }

      setSubmitSuccess("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1200);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background grid place-items-center px-4">
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm text-center space-y-3 w-full max-w-md">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-accent" />
          <p className="text-sm text-muted-foreground">Validating reset link...</p>
        </div>
      </div>
    );
  }

  if (!isRecoverySession && !invalidLinkError) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/10 dark:bg-amber-900/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/10 dark:bg-blue-900/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 min-h-screen grid place-items-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border-2 border-border/70 bg-card/95 backdrop-blur-sm shadow-[0_10px_35px_rgba(0,0,0,0.08)] p-6 sm:p-7 space-y-6">
          <div className="space-y-3 text-center">
            <div className="mx-auto h-11 w-11 rounded-xl gold-gradient flex items-center justify-center shadow-sm">
              <KeyRound className="h-5 w-5 text-accent-foreground" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              Set a new secure password for your CertifyPro admin account.
            </p>
          </div>

          {invalidLinkError ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{invalidLinkError}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="new-password" className="text-sm font-medium text-foreground">
                  New password
                </label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    placeholder="Enter new password"
                    className="h-11 pr-10 bg-background/50 border-input/60 focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-accent focus-visible:outline-none focus-visible:text-accent transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                  Confirm password
                </label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="Confirm new password"
                    className="h-11 pr-10 bg-background/50 border-input/60 focus-visible:ring-offset-0 focus-visible:ring-2 focus-visible:ring-ring transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 hover:text-accent focus-visible:outline-none focus-visible:text-accent transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {passwordTooShort ? (
                <p className="text-xs text-destructive">
                  Password too short. Use at least {MIN_PASSWORD_LENGTH} characters.
                </p>
              ) : null}

              {passwordMismatch ? <p className="text-xs text-destructive">Passwords do not match.</p> : null}

              {submitError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  {submitError}
                </div>
              ) : null}

              {submitSuccess ? (
                <div className="rounded-lg border border-emerald-300/40 bg-emerald-100/60 px-3 py-2 text-xs text-emerald-700 flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{submitSuccess}</span>
                </div>
              ) : null}

              <Button
                type="button"
                className="w-full h-11 gold-gradient text-accent-foreground font-semibold hover:opacity-90 transition-opacity"
                disabled={!canSubmit}
                onClick={() => void handleSubmit()}
              >
                {submitting ? "Updating password..." : "Update password"}
              </Button>
            </div>
          )}

          <div className="pt-2 border-t border-border/60 space-y-3">
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Secure password update via Supabase Auth</span>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Return to{" "}
              <Link to="/login" className="text-accent font-medium hover:underline">
                login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;