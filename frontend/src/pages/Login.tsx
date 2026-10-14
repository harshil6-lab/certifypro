import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, UserPlus, CheckCircle, ArrowRight, Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SectionCard } from "@/components/SectionCard";
import loginBg from "@/assets/login-bg.jpg";
import whiteCertifyProLogo from "@/assets/white_certify_pro_logo.png";
import certifyProIcon from "@/assets/certify_pro_icon.png";
import AdminAccessRequestModal from "@/components/AdminAccessRequestModal";
import PublicCertificateVerificationModal from "@/components/PublicCertificateVerificationModal";
import {
  isSupabaseConfigured,
  sendPasswordResetEmail,
  signInWithEmailPassword,
} from "@/lib/auth";
import { useCaptchaToken } from "@/hooks/useCaptchaToken";
import { getMySubscription } from "@/services/subscriptionService";

const Login = () => {
  const navigate = useNavigate();
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [searchParams] = useSearchParams();
  const templateRedirect = searchParams.get("reason") === "templates";
  const redirectTo = searchParams.get("redirect") || "/dashboard";
  const captcha = useCaptchaToken();
  const Captcha = captcha.Widget;
  // Turnstile tokens are single-use; when the site key is configured the
  // form actions stay disabled until a fresh token exists.
  const captchaBlocking = captcha.isConfigured && !captcha.token;

  const handleSignIn = async () => {
    setAuthError("");
    setResetMessage("");
    setIsSigningIn(true);

    try {
      const result = await signInWithEmailPassword(
        email,
        password,
        captcha.isConfigured ? captcha.token : undefined,
      );
      if (!result.success) {
        setAuthError(result.error || "Unable to sign in. Please try again.");
        return;
      }

      if (result.firstLoginRequired) {
        navigate("/dashboard/profile?section=security&firstLogin=1");
        return;
      }

      // Check if user needs to select a plan
      try {
        const sub = await getMySubscription();
        console.log("Subscription check result:", sub); // Debug log
        if (!sub.plan_selected) {
          navigate("/select-plan");
          return;
        }
      } catch (err) {
        console.error("Subscription check failed:", err); // Debug log
        // If subscription check fails, proceed normally — don't block login
      }

      navigate(redirectTo);
    } catch {
      setAuthError("Unexpected authentication error. Please try again.");
    } finally {
      // Tokens are single-use: always reset so the next attempt needs a fresh check.
      captcha.reset();
      setIsSigningIn(false);
    }
  };

  const handlePasswordReset = async () => {
    setAuthError("");
    setResetMessage("");

    const result = await sendPasswordResetEmail(
      email,
      captcha.isConfigured ? captcha.token : undefined,
    );
    // The reset token is single-use regardless of the outcome.
    captcha.reset();
    if (!result.success) {
      setAuthError(result.error || "Unable to send reset email.");
      return;
    }

    setResetMessage("Password reset link sent. Please check your inbox.");
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left panel — branding */}
      <div
        className="relative hidden w-1/2 items-center justify-center p-12 lg:flex"
        style={{ backgroundImage: `url(${loginBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Navy overlay for legible, calm contrast */}
        <div className="absolute inset-0 bg-primary/90" />

        <div className="relative z-10 max-w-md space-y-8 text-center">
          <img
            src={whiteCertifyProLogo}
            alt="CertifyPro"
            className="mx-auto h-12 w-auto object-contain"
          />

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold tracking-tight text-primary-foreground">
              Admin Portal
            </h1>
            <p className="text-base text-primary-foreground/80">
              Certificate automation &amp; verification
            </p>
          </div>

          <p className="mx-auto max-w-sm text-sm leading-relaxed text-primary-foreground/70">
            Manage certificate issuance, templates, student records, and public verification from one secure workspace.
          </p>

          <div className="border-t border-primary-foreground/15 pt-8">
            <p className="text-xs font-medium uppercase tracking-widest text-primary-foreground/60">
              Secure certificate management platform
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="relative flex flex-1 items-center justify-center overflow-y-auto p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile header */}
          <div className="flex flex-col items-center gap-2 text-center lg:hidden">
            <img src={certifyProIcon} alt="CertifyPro" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Admin Portal</h1>
              <p className="mt-1 text-xs text-muted-foreground">Secure access</p>
            </div>
          </div>

          {/* Page heading */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Welcome back
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Sign in to manage certificates, templates, student records, and verifications.
            </p>
            {templateRedirect ? (
              <Alert variant="info">
                <AlertDescription>Please sign in to access certificate templates.</AlertDescription>
              </Alert>
            ) : null}
          </div>

          {/* Sign-in form */}
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSignIn();
            }}
          >
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@institution.edu"
                  type="email"
                  autoComplete="email"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => void handlePasswordReset()}
                  disabled={captchaBlocking}
                  className="rounded-sm text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
                </button>
              </div>
            </div>

            {authError ? (
              <Alert variant="destructive">
                <AlertTitle>Sign-in failed</AlertTitle>
                <AlertDescription>{authError}</AlertDescription>
              </Alert>
            ) : null}
            {resetMessage ? (
              <Alert variant="success">
                <AlertTitle>Check your inbox</AlertTitle>
                <AlertDescription>{resetMessage}</AlertDescription>
              </Alert>
            ) : null}
            {captcha.isConfigured ? (
              <div className="flex flex-col items-center gap-1">
                <Captcha />
                {captchaBlocking ? (
                  <p className="text-xs text-muted-foreground">
                    Complete the security check to continue.
                  </p>
                ) : null}
              </div>
            ) : null}
            {!isSupabaseConfigured ? (
              <Alert variant="warning">
                <AlertTitle>Not configured</AlertTitle>
                <AlertDescription>Authentication is not fully configured. Ask an administrator to set the required environment values.</AlertDescription>
              </Alert>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isSigningIn || captchaBlocking}
            >
              {isSigningIn ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          {/* Request admin access */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setAdminModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" aria-hidden="true" />
            Request admin access
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background px-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                Public portal
              </span>
            </div>
          </div>

          {/* Public verification */}
          <SectionCard>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-success/10 text-success">
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Verify a certificate</h3>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Students, employers, and institutions can confirm certificate authenticity instantly — no account required.
            </p>
            <Button
              type="button"
              variant="outline"
              className="mt-4 w-full justify-between"
              onClick={() => setVerificationModalOpen(true)}
            >
              Verify now
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </SectionCard>

          {/* Modals */}
          <AdminAccessRequestModal
            open={adminModalOpen}
            onOpenChange={setAdminModalOpen}
          />
          <PublicCertificateVerificationModal
            open={verificationModalOpen}
            onOpenChange={setVerificationModalOpen}
          />
        </div>
      </div>
    </div>
  );
};

export default Login;
