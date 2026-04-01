import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, Mail, ShieldCheck, UserPlus, CheckCircle, ArrowRight, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const Login = () => {
  const navigate = useNavigate();
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState("");
  const [resetMessage, setResetMessage] = useState("");
  const [searchParams] = useSearchParams();
  const templateRedirect = searchParams.get("reason") === "templates";
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const handleSignIn = async () => {
    setAuthError("");
    setResetMessage("");
    setIsSigningIn(true);

    try {
      const result = await signInWithEmailPassword(email, password);
      if (!result.success) {
        setAuthError(result.error || "Unable to sign in. Please try again.");
        return;
      }

      if (result.firstLoginRequired) {
        navigate("/dashboard/profile?section=security&firstLogin=1");
        return;
      }

      navigate(redirectTo);
    } catch {
      setAuthError("Unexpected authentication error. Please try again.");
    } finally {
      setIsSigningIn(false);
    }
  };

  const handlePasswordReset = async () => {
    setAuthError("");
    setResetMessage("");

    const result = await sendPasswordResetEmail(email);
    if (!result.success) {
      setAuthError(result.error || "Unable to send reset email.");
      return;
    }

    setResetMessage("Password reset link sent. Please check your inbox.");
  };

  return (
    <div className="min-h-screen flex bg-background overflow-hidden">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12"
        style={{ backgroundImage: `url(${loginBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        {/* Gradient overlay for better text contrast */}
        <div className="absolute inset-0 navy-gradient opacity-85" />

        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-amber-400 blur-3xl opacity-10" />
          <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-blue-400 blur-3xl opacity-10" />
        </div>

        {/* Branding content */}
        <div className="relative z-10 max-w-md text-center space-y-10">
          {/* Logo badge */}
          <div className="flex justify-center mb-4">
            <img src={whiteCertifyProLogo} alt="CertifyPro Logo" className="h-12 lg:h-14 w-auto object-contain opacity-100" />
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-5xl lg:text-6xl font-heading font-bold text-primary-foreground leading-tight drop-shadow-sm">
              Admin Portal
            </h1>
            <p className="text-xl text-primary-foreground/90 font-body font-light tracking-wide">
              Certificate Automation &amp; Verification
            </p>
          </div>

          {/* Tagline */}
          <p className="text-base text-primary-foreground/70 font-body leading-relaxed max-w-sm mx-auto">
            Enterprise-grade certificate management trusted by leading institutions worldwide. Secure, scalable, and intelligent.
          </p>

          {/* Trust indicator */}
          <div className="flex items-center justify-center gap-3 text-primary-foreground/70 text-sm">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-accent" />
            <span className="font-medium">Trusted by 200+ institutions</span>
          </div>

          {/* Footer note */}
          <div className="pt-8 border-t border-white/20">
            <p className="text-xs text-primary-foreground/60 uppercase tracking-widest font-semibold">
              Secure Certificate Management Platform
            </p>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12 min-h-screen relative overflow-y-auto">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/10 dark:bg-amber-900/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-100/10 dark:bg-blue-900/5 rounded-full blur-3xl" />
        </div>

        {/* Form container with glass effect */}
        <div className="w-full max-w-md space-y-6 animate-fade-in relative z-10">
          {/* Mobile header */}
          <div className="lg:hidden flex flex-col items-center gap-2 text-center mb-4">
            <img src={certifyProIcon} alt="CertifyPro Logo" className="h-12 w-12 object-contain" />
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">Admin Portal</h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Secure Access</p>
            </div>
          </div>

          {/* Page heading */}
          <div className="space-y-2 text-center lg:text-left">
            <h2 className="text-3xl lg:text-3xl font-heading font-bold text-foreground leading-tight">
              Welcome Back
            </h2>
            <p className="text-sm text-muted-foreground/90 font-body leading-relaxed">
              Sign in to manage certificates, templates, student records, and secure verifications
            </p>
            {templateRedirect ? (
              <div className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
                Please login to access certificate templates.
              </div>
            ) : null}
          </div>

          {/* Admin Login Section */}
          <div className="space-y-4">
            {/* Email and Password inputs */}
            <div className="space-y-4">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60 group-focus-within:text-accent transition-colors" />
                <Input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@institution.edu"
                  type="email"
                  autoComplete="email"
                  className="pl-12 h-14 border-2 border-border bg-background/50 focus:bg-background focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-300 placeholder:text-muted-foreground/50 font-body text-base"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground/60 group-focus-within:text-accent transition-colors" />
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  type="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  className="pl-12 h-14 border-2 border-border bg-background/50 focus:bg-background focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-300 placeholder:text-muted-foreground/50 font-body text-base"
                />
              </div>
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  {/* Add Remember Me check here if needed later */}
                </div>
                <button
                  type="button"
                  onClick={() => void handlePasswordReset()}
                  className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors py-1"
                >
                  Forgot password?
                </button>
              </div>

              {authError ? (
                <div className="rounded-lg border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-base text-destructive font-medium flex items-start gap-2">
                  <XCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <span>{authError}</span>
                </div>
              ) : null}
              {resetMessage ? (
                <div className="rounded-lg border-2 border-emerald-300/50 bg-emerald-100/60 px-4 py-3 text-sm text-emerald-700 font-medium flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{resetMessage}</span>
                </div>
              ) : null}
              {!isSupabaseConfigured ? (
                <div className="rounded-lg border border-amber-300/40 bg-amber-100/60 px-3 py-2 text-xs text-amber-800">
                  Authentication is not fully configured. Ask an admin to set Supabase environment values.
                </div>
              ) : null}
            </div>

            {/* Sign In Button */}
            <div className="block pt-2">
              <Button
                type="button"
                className="w-full h-14 text-lg font-bold gold-gradient text-accent-foreground hover:shadow-lg hover:shadow-amber-500/30 active:scale-[0.98] transition-all duration-300"
                onClick={() => void handleSignIn()}
                disabled={isSigningIn}
              >
                {isSigningIn ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>
          </div>

          {/* Security notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70 font-medium py-1">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>SHA‑256 encrypted • HIPAA compliant</span>
          </div>

          {/* Request Admin Access */}
          <div className="py-2">
            <button
              type="button"
              onClick={() => setAdminModalOpen(true)}
              className="group relative w-full inline-flex items-center justify-center gap-2 rounded-xl border-2 border-accent/30 bg-gradient-to-br from-accent/8 to-transparent px-6 py-3.5 text-sm font-semibold text-accent hover:border-accent/60 hover:bg-gradient-to-br hover:from-accent/15 hover:to-accent/5 hover:shadow-[0_8px_24px_rgba(217,169,56,0.15)] dark:hover:shadow-[0_8px_24px_rgba(217,169,56,0.25)] active:scale-95 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-lg gold-gradient shadow-md transition-transform duration-300 group-hover:scale-110">
                <UserPlus className="h-3.5 w-3.5 text-accent-foreground" />
              </span>
              <span>Request Admin Access</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-background dark:bg-background px-3 text-xs uppercase tracking-widest font-semibold text-muted-foreground/60">
                Public Portal
              </span>
            </div>
          </div>

          {/* Public Verification Section */}
          <div
            className="group rounded-2xl border-2 border-border/60 bg-gradient-to-br from-card/40 to-card/20 dark:from-slate-800/40 dark:to-slate-900/40 backdrop-blur-sm p-6 sm:p-7 space-y-5 cursor-pointer transition-all duration-500 hover:border-accent/40 hover:bg-gradient-to-br hover:from-card/60 hover:to-card/40 hover:shadow-[0_16px_40px_rgba(217,169,56,0.12)] dark:hover:shadow-[0_16px_40px_rgba(217,169,56,0.2)]"
            onClick={() => setVerificationModalOpen(true)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setVerificationModalOpen(true)}
          >
            {/* Header */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/40 dark:to-emerald-900/20 ring-1 ring-emerald-200/50 dark:ring-emerald-800/50">
                  <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">Verify a Certificate</h3>
              </div>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">
                Students, employers, &amp; institutions can verify certificate authenticity instantly. No account necessary.
              </p>
            </div>

            {/* Bottom action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-medium text-muted-foreground/60 uppercase tracking-wider">
                Public verification portal
              </span>
              <ArrowRight className="w-4 h-4 text-accent/70 transition-transform duration-300 group-hover:translate-x-1" />
            </div>

            {/* Button */}
            <Button
              className="w-full h-10 text-sm font-semibold gold-gradient text-accent-foreground hover:shadow-md hover:shadow-amber-500/20 active:scale-95 transition-all duration-300 mt-2"
              onClick={(e) => {
                e.stopPropagation();
                setVerificationModalOpen(true);
              }}
            >
              Start Verification
            </Button>
          </div>

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
