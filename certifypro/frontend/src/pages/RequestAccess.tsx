import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Award,
  CheckCircle2,
  Clock,
  FileCheck,
  Loader2,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface FormErrors {
  name?: string;
  institution?: string;
  email?: string;
  purpose?: string;
}

/* ------------------------------------------------------------------ */
/*  Validation                                                         */
/* ------------------------------------------------------------------ */

const INSTITUTION_EMAIL_RE =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(edu|ac\.[a-z]{2}|edu\.[a-z]{2}|org|gov)$/i;

function validate(form: HTMLFormElement): FormErrors {
  const data = new FormData(form);
  const errors: FormErrors = {};

  const name = (data.get("name") as string)?.trim();
  const institution = (data.get("institution") as string)?.trim();
  const email = (data.get("email") as string)?.trim();
  const purpose = (data.get("purpose") as string)?.trim();

  if (!name || name.length < 2) errors.name = "Please enter your full name.";
  if (!institution || institution.length < 2)
    errors.institution = "Please enter your institution or organization.";
  if (!email) {
    errors.email = "Email is required.";
  } else if (!INSTITUTION_EMAIL_RE.test(email)) {
    errors.email =
      "Please use an official institutional email (e.g. .edu, .ac.*, .org, .gov).";
  }
  if (!purpose || purpose.length < 10)
    errors.purpose =
      "Briefly describe your role or purpose (min 10 characters).";

  return errors;
}

/* ------------------------------------------------------------------ */
/*  Approval‑flow steps                                                */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    num: 1,
    icon: FileCheck,
    label: "Submit Request",
    description: "Fill out the form with your institutional details and role.",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    iconColor: "text-blue-600 dark:text-blue-400",
    ring: "ring-blue-200 dark:ring-blue-800",
  },
  {
    num: 2,
    icon: Clock,
    label: "Review & Verification",
    description:
      "Our team verifies your email and institutional affiliation within 24–48 hours.",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    iconColor: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-200 dark:ring-amber-800",
  },
  {
    num: 3,
    icon: Mail,
    label: "Approval Email",
    description:
      "You'll receive a confirmation email with your login credentials once approved.",
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-700 dark:text-green-300",
    iconColor: "text-green-600 dark:text-green-400",
    ring: "ring-green-200 dark:ring-green-800",
  },
  {
    num: 4,
    icon: Zap,
    label: "Login & Get Started",
    description:
      "Sign in with your approved credentials and start managing certificates instantly.",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
    iconColor: "text-purple-600 dark:text-purple-400",
    ring: "ring-purple-200 dark:ring-purple-800",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const RequestAccess = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  /* Auto‑focus first field on mount */
  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 400);
    return () => clearTimeout(t);
  }, []);

  /* ---- Submission handler ---- */
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const validationErrors = validate(form);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        const firstKey = Object.keys(validationErrors)[0] as keyof FormErrors;
        form.querySelector<HTMLElement>(`[name="${firstKey}"]`)?.focus();
        return;
      }

      setErrors({});
      setIsSubmitting(true);

      /*
       * TODO: Replace with actual API call:
       *   await api.post("/admin-access-requests", Object.fromEntries(new FormData(form)));
       */
      setTimeout(() => {
        toast({
          title: "Request submitted successfully",
          description:
            "We'll review your details and reach out within 1–2 business days.",
        });
        setIsSubmitting(false);
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 1000);
    },
    [],
  );

  /* ================================================================ */
  /*  Success State                                                    */
  /* ================================================================ */

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center space-y-8 ra-fade-in-up">
          {/* Animated success icon */}
          <div className="relative mx-auto w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-green-100 dark:bg-green-900/30 ra-pulse-ring" />
            <div className="relative w-24 h-24 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center ra-scale-in">
              <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          </div>

          <div className="space-y-3 ra-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Request Submitted!
            </h1>
            <p className="text-muted-foreground leading-relaxed max-w-md mx-auto">
              Your admin access request has been received. Our team will review your
              details and reach out within{" "}
              <span className="font-semibold text-foreground">1–2 business days</span>{" "}
              via the email you provided.
            </p>
          </div>

          <div
            className="flex flex-col sm:flex-row gap-3 justify-center ra-fade-in-up"
            style={{ animationDelay: "0.4s" }}
          >
            <Link to="/login">
              <Button className="h-11 px-8 font-medium gold-gradient text-accent-foreground hover:opacity-90 transition-opacity">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Login
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="h-11 px-8 font-medium">
                Go to Homepage
              </Button>
            </Link>
          </div>

          {/* What to expect */}
          <div
            className="bg-muted/50 rounded-xl p-6 text-left border ra-fade-in-up"
            style={{ animationDelay: "0.6s" }}
          >
            <h3 className="text-sm font-heading font-semibold text-foreground mb-3">
              What happens next?
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                We'll verify your institutional email and affiliation
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                An approval email will be sent with your login credentials
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                You can then sign in and start issuing certificates
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Main Form Page                                                   */
  /* ================================================================ */

  return (
    <div className="min-h-screen bg-background">
      {/* ---- Top navigation bar ---- */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <Award className="w-4 h-4 text-accent-foreground" />
            </div>
            <span className="text-base font-heading font-bold text-foreground hidden sm:inline">
              CertifyPro
            </span>
          </Link>
        </div>
      </nav>

      {/* ---- Hero section ---- */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 seal-pattern" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8 sm:pt-16 sm:pb-12">
          <div className="max-w-2xl ra-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 border border-primary/10 text-xs font-medium text-primary mb-6 ra-fade-in-up">
              <ShieldCheck className="w-3.5 h-3.5" />
              Institutional Administrators Only
            </div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground leading-tight mb-3 ra-fade-in-up" style={{ animationDelay: "0.1s" }}>
              Request Admin Access
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed ra-fade-in-up" style={{ animationDelay: "0.15s" }}>
              Get access to manage certificates, templates, and verifications for
              your institution. Complete the form below and our team will review
              your request.
            </p>
          </div>
        </div>
      </header>

      {/* ---- Content ---- */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* ====== Form Column ====== */}
          <section
            className="lg:col-span-7 ra-fade-in-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="bg-card rounded-2xl border card-shadow p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
                  <UserPlus className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-heading font-semibold text-foreground">
                    Your Details
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    All fields marked with{" "}
                    <span className="text-destructive">*</span> are required
                  </p>
                </div>
              </div>

              <form
                ref={formRef}
                onSubmit={handleSubmit}
                noValidate
                className="space-y-5"
              >
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="ra-name" className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={firstInputRef}
                    id="ra-name"
                    name="name"
                    autoComplete="name"
                    required
                    placeholder="e.g. Dr. Sarah Johnson"
                    disabled={isSubmitting}
                    className="h-11"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "err-name" : undefined}
                  />
                  {errors.name && (
                    <p id="err-name" className="text-xs text-destructive" role="alert">
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Institution / Organization */}
                <div className="space-y-1.5">
                  <Label htmlFor="ra-institution" className="text-sm font-medium">
                    Institution / Organization{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="ra-institution"
                    name="institution"
                    autoComplete="organization"
                    required
                    placeholder="e.g. Stanford University"
                    disabled={isSubmitting}
                    className="h-11"
                    aria-invalid={!!errors.institution}
                    aria-describedby={
                      errors.institution ? "err-institution" : undefined
                    }
                  />
                  {errors.institution && (
                    <p
                      id="err-institution"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {errors.institution}
                    </p>
                  )}
                </div>

                {/* Official Institutional Email */}
                <div className="space-y-1.5">
                  <Label htmlFor="ra-email" className="text-sm font-medium">
                    Official Institutional Email{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
                    <Input
                      id="ra-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="admin@institution.edu"
                      disabled={isSubmitting}
                      className="h-11 pl-10"
                      aria-invalid={!!errors.email}
                      aria-describedby="email-hint err-email"
                    />
                  </div>
                  <p id="email-hint" className="text-xs text-muted-foreground">
                    Use an institution‑issued address for faster verification.
                  </p>
                  {errors.email && (
                    <p
                      id="err-email"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {errors.email}
                    </p>
                  )}
                </div>

                {/* Role / Purpose */}
                <div className="space-y-1.5">
                  <Label htmlFor="ra-purpose" className="text-sm font-medium">
                    Role / Purpose <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="ra-purpose"
                    name="purpose"
                    required
                    placeholder="e.g. Registrar office admin, Certificate coordinator, IT administrator…"
                    disabled={isSubmitting}
                    className="min-h-[80px] resize-none"
                    aria-invalid={!!errors.purpose}
                    aria-describedby={errors.purpose ? "err-purpose" : undefined}
                  />
                  {errors.purpose && (
                    <p
                      id="err-purpose"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {errors.purpose}
                    </p>
                  )}
                </div>

                {/* Optional Notes */}
                <div className="space-y-1.5">
                  <Label htmlFor="ra-notes" className="text-sm font-medium">
                    Additional Notes{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="ra-notes"
                    name="notes"
                    placeholder="Any additional context or special requirements…"
                    disabled={isSubmitting}
                    className="min-h-[64px] resize-none"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 text-base font-medium gold-gradient text-accent-foreground hover:opacity-90 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting Request…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Submit Access Request
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                  By submitting, you agree that the information provided is accurate
                  and associated with your institution.
                </p>
              </form>
            </div>
          </section>

          {/* ====== Sidebar — Approval Guide ====== */}
          <aside
            className="lg:col-span-5 space-y-6"
            aria-label="Admin approval process guide"
          >
            {/* How it works card */}
            <div
              className="bg-card rounded-2xl border card-shadow p-6 sm:p-8 ra-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold text-foreground">
                    How It Works
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    From request to full admin access
                  </p>
                </div>
              </div>

              <ol className="space-y-1">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <li
                      key={step.num}
                      className="flex gap-4 ra-fade-in-up"
                      style={{ animationDelay: `${0.35 + i * 0.08}s` }}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full ${step.bg} ${step.text} flex items-center justify-center font-bold text-sm ring-2 ${step.ring}`}
                        >
                          {step.num}
                        </div>
                        {i < STEPS.length - 1 && (
                          <div className="w-px flex-1 bg-border my-1" />
                        )}
                      </div>
                      <div className="pb-5 min-w-0">
                        <p className="font-medium text-sm text-foreground flex items-center gap-2 mb-0.5">
                          <Icon className={`w-4 h-4 ${step.iconColor}`} />
                          {step.label}
                        </p>
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          {step.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Why institutional email card */}
            <div
              className="bg-muted/50 rounded-2xl border p-6 ra-fade-in-up"
              style={{ animationDelay: "0.5s" }}
            >
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-heading font-semibold text-foreground mb-1">
                    Why institutional email?
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    An official institution-issued email lets us verify your
                    affiliation quickly and protects against unauthorized admin
                    access to the certificate platform.
                  </p>
                </div>
              </div>
            </div>

            {/* Support card */}
            <div
              className="bg-muted/50 rounded-2xl border p-6 ra-fade-in-up"
              style={{ animationDelay: "0.55s" }}
            >
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h4 className="text-sm font-heading font-semibold text-foreground mb-1">
                    Need help?
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Contact us at{" "}
                    <a
                      href="mailto:support@certifypro.com"
                      className="font-medium text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                    >
                      support@certifypro.com
                    </a>{" "}
                    for any questions about admin access.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default RequestAccess;
