import { Link } from "react-router-dom";
import { Award, Lock, Mail, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import loginBg from "@/assets/login-bg.jpg";

const Login = () => {

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 relative items-center justify-center p-12"
        style={{ backgroundImage: `url(${loginBg})`, backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <div className="absolute inset-0 navy-gradient opacity-80" />
        <div className="relative z-10 max-w-md text-center space-y-8">
          <div className="w-20 h-20 mx-auto rounded-2xl gold-gradient flex items-center justify-center card-shadow-lg">
            <Award className="w-10 h-10 text-accent-foreground" />
          </div>
          <h1 className="text-4xl font-heading font-bold text-primary-foreground leading-tight">
            CertifyPro
          </h1>
          <p className="text-lg text-primary-foreground/80 font-body">
            Certificate Automation &amp; Verification System
          </p>
          <div className="flex items-center gap-3 justify-center text-primary-foreground/60 text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Trusted by 200+ institutions worldwide</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8 animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <Award className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-xl font-heading font-bold text-foreground">CertifyPro</span>
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Welcome to CertifyPro Admin Portal
            </h2>
            <p className="text-muted-foreground text-sm">
              Sign in to manage certificates, templates, and verifications
            </p>
          </div>

          <div className="space-y-4">
            <Button variant="outline" className="w-full h-11 gap-3 font-medium">
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground">or sign in with email</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input placeholder="admin@institution.edu" className="pl-10 h-11" />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input type="password" placeholder="Password" className="pl-10 h-11" />
              </div>
            </div>

            <Link to="/dashboard">
              <Button className="w-full h-11 font-medium gold-gradient text-accent-foreground hover:opacity-90 transition-opacity mt-2">
                Sign In
              </Button>
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground justify-center pt-4">
            <Lock className="w-3 h-3" />
            <span>Your certificates are protected with SHA‑256 encryption</span>
          </div>

          {/* Request Admin Access CTA */}
          <div className="pt-2">
            <Link to="/request-access" className="block">
              <Button
                variant="outline"
                className="w-full h-10 gap-2 text-sm font-medium border-primary/20 text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 group"
              >
                <ShieldCheck className="w-4 h-4 text-primary/60 group-hover:text-primary transition-colors" />
                Request Admin Access
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
