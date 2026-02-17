import { useState } from "react";
import { Link } from "react-router-dom";
import { Award, Lock, Mail, ShieldCheck, UserPlus, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import loginBg from "@/assets/login-bg.jpg";
import AdminAccessRequestModal from "@/components/AdminAccessRequestModal";
import PublicCertificateVerificationModal from "@/components/PublicCertificateVerificationModal";

const Login = () => {
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

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
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 gold-gradient rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity" />
              <div className="relative w-24 h-24 rounded-3xl gold-gradient flex items-center justify-center card-shadow-lg ring-1 ring-white/20 backdrop-blur-sm">
                <Award className="w-12 h-12 text-accent-foreground drop-shadow-sm" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-5xl lg:text-6xl font-heading font-bold text-primary-foreground leading-tight drop-shadow-sm">
              CertifyPro
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
        <div className="w-full max-w-md space-y-8 animate-fade-in relative z-10">
          {/* Mobile header */}
          <div className="lg:hidden flex flex-col items-center gap-3 text-center mb-8">
            <div className="relative">
              <div className="absolute inset-0 gold-gradient rounded-2xl blur-lg opacity-20" />
              <div className="relative w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center ring-1 ring-white/20">
                <Award className="w-8 h-8 text-accent-foreground" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-heading font-bold text-foreground">CertifyPro</h1>
              <p className="text-xs text-muted-foreground mt-1 font-medium">Admin Portal</p>
            </div>
          </div>

          {/* Page heading */}
          <div className="space-y-3 text-center lg:text-left">
            <h2 className="text-3xl lg:text-3xl font-heading font-bold text-foreground leading-tight">
              Welcome Back
            </h2>
            <p className="text-sm text-muted-foreground/90 font-body leading-relaxed">
              Sign in to manage certificates, templates, student records, and secure verifications
            </p>
          </div>

          {/* Admin Login Section */}
          <div className="space-y-4 pt-2">
            {/* Google Sign In */}
            <Button 
              variant="outline" 
              className="w-full h-12 gap-3 font-medium text-foreground border-2 border-border hover:bg-accent/5 hover:border-accent/50 transition-all duration-300"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            {/* Divider */}
            <div className="relative py-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background dark:bg-background px-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground/70">
                  Or continue with email
                </span>
              </div>
            </div>

            {/* Email and Password inputs */}
            <div className="space-y-3">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-accent transition-colors" />
                <Input 
                  placeholder="admin@institution.edu" 
                  className="pl-11 h-12 border-2 border-border bg-background/50 focus:bg-background focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-300 placeholder:text-muted-foreground/50 font-body text-sm"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60 group-focus-within:text-accent transition-colors" />
                <Input 
                  type="password" 
                  placeholder="Password" 
                  className="pl-11 h-12 border-2 border-border bg-background/50 focus:bg-background focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all duration-300 placeholder:text-muted-foreground/50 font-body text-sm"
                />
              </div>
            </div>

            {/* Sign In Button */}
            <Link to="/dashboard" className="block pt-1">
              <Button 
                className="w-full h-12 font-semibold gold-gradient text-accent-foreground hover:shadow-lg hover:shadow-amber-500/30 active:scale-98 transition-all duration-300"
              >
                Sign In
              </Button>
            </Link>
          </div>

          {/* Security notice */}
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/70 font-medium py-2">
            <Lock className="w-3.5 h-3.5 flex-shrink-0" />
            <span>SHA‑256 encrypted • HIPAA compliant</span>
          </div>

          {/* Request Admin Access */}
          <div className="py-4">
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
          <div className="relative py-6">
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
