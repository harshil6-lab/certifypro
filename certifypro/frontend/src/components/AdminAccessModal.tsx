import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileCheck,
  Loader2,
  Mail,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AdminAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormErrors {
  name?: string;
  institution?: string;
  email?: string;
  purpose?: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
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
/*  Approval‑flow steps config                                        */
/* ------------------------------------------------------------------ */

const STEPS = [
  {
    num: 1,
    icon: FileCheck,
    label: "Submit Request",
    description: "Fill out the form with your institutional details.",
    bg: "bg-blue-100 dark:bg-blue-900/40",
    text: "text-blue-700 dark:text-blue-300",
    iconColor: "text-blue-600 dark:text-blue-400",
  },
  {
    num: 2,
    icon: Clock,
    label: "Review & Verification",
    description:
      "Our team verifies your email and institutional affiliation (24–48 hrs).",
    bg: "bg-amber-100 dark:bg-amber-900/40",
    text: "text-amber-700 dark:text-amber-300",
    iconColor: "text-amber-600 dark:text-amber-400",
  },
  {
    num: 3,
    icon: Mail,
    label: "Approval Email",
    description:
      "You'll receive a confirmation email once your account is approved.",
    bg: "bg-green-100 dark:bg-green-900/40",
    text: "text-green-700 dark:text-green-300",
    iconColor: "text-green-600 dark:text-green-400",
  },
  {
    num: 4,
    icon: Zap,
    label: "Login & Get Started",
    description:
      "Sign in with your approved credentials and start managing certificates.",
    bg: "bg-purple-100 dark:bg-purple-900/40",
    text: "text-purple-700 dark:text-purple-300",
    iconColor: "text-purple-600 dark:text-purple-400",
  },
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const AdminAccessModal = ({ open, onOpenChange }: AdminAccessModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  /* Reset state when modal re‑opens */
  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setErrors({});
      setIsSubmitting(false);
    }
  }, [open]);

  /* Auto‑focus first field on open */
  useEffect(() => {
    if (open && !submitted) {
      const t = setTimeout(() => firstInputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [open, submitted]);

  /* ---- Submission handler ---- */
  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const validationErrors = validate(form);

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        // Focus the first invalid field
        const firstKey = Object.keys(validationErrors)[0] as keyof FormErrors;
        const el = form.querySelector<HTMLElement>(`[name="${firstKey}"]`);
        el?.focus();
        return;
      }

      setErrors({});
      setIsSubmitting(true);

      /*
       * TODO: Replace this timeout with an actual API call, e.g.:
       *   await api.post("/admin-access-requests", Object.fromEntries(new FormData(form)));
       */
      setTimeout(() => {
        toast({
          title: "Request submitted",
          description:
            "Your admin access request has been received. You'll hear from us within 1–2 business days.",
        });
        setIsSubmitting(false);
        setSubmitted(true);
      }, 900);
    },
    [],
  );

  /* ---- Close helper ---- */
  const handleClose = useCallback(() => onOpenChange(false), [onOpenChange]);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 gap-0"
        aria-describedby="admin-access-desc"
      >
        {/* ---------- Success State ---------- */}
        {submitted ? (
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center space-y-6 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-2 max-w-sm">
              <h3 className="text-xl font-heading font-semibold text-foreground">
                Request Submitted Successfully
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We've received your admin access request. Our team will review
                your details and reach out within{" "}
                <span className="font-medium text-foreground">
                  1–2 business days
                </span>{" "}
                via the email you provided.
              </p>
            </div>
            <Button
              variant="outline"
              className="mt-2 h-10 px-6 font-medium"
              onClick={handleClose}
              autoFocus
            >
              Back to Login
            </Button>
          </div>
        ) : (
          <>
            {/* ---------- Header ---------- */}
            <DialogHeader className="px-6 pt-6 pb-2 space-y-1">
              <DialogTitle className="text-xl font-heading font-bold">
                Request Admin Access
              </DialogTitle>
              <DialogDescription
                id="admin-access-desc"
                className="text-sm text-muted-foreground"
              >
                For institution administrators who need to manage certificates
                and verifications.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 lg:gap-6 px-6 pb-6 pt-4">
              {/* ---------- Form (3 / 5 columns) ---------- */}
              <form
                ref={formRef}
                onSubmit={handleSubmit}
                noValidate
                className="lg:col-span-3 space-y-4"
              >
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="admin-name" className="text-sm font-medium">
                    Full Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    ref={firstInputRef}
                    id="admin-name"
                    name="name"
                    autoComplete="name"
                    required
                    placeholder="Your full name"
                    disabled={isSubmitting}
                    className="h-10"
                    aria-invalid={!!errors.name}
                    aria-describedby={errors.name ? "err-name" : undefined}
                  />
                  {errors.name && (
                    <p
                      id="err-name"
                      className="text-xs text-destructive"
                      role="alert"
                    >
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Institution / Organization */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="admin-institution"
                    className="text-sm font-medium"
                  >
                    Institution / Organization{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="admin-institution"
                    name="institution"
                    autoComplete="organization"
                    required
                    placeholder="University, College, or Organization"
                    disabled={isSubmitting}
                    className="h-10"
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
                  <Label htmlFor="admin-email" className="text-sm font-medium">
                    Official Institutional Email{" "}
                    <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="admin@institution.edu"
                    disabled={isSubmitting}
                    className="h-10"
                    aria-invalid={!!errors.email}
                    aria-describedby="email-hint err-email"
                  />
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
                  <Label
                    htmlFor="admin-purpose"
                    className="text-sm font-medium"
                  >
                    Role / Purpose <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="admin-purpose"
                    name="purpose"
                    required
                    placeholder="e.g., Registrar office admin, Certificate coordinator…"
                    disabled={isSubmitting}
                    className="min-h-[72px] resize-none"
                    aria-invalid={!!errors.purpose}
                    aria-describedby={
                      errors.purpose ? "err-purpose" : undefined
                    }
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
                  <Label htmlFor="admin-notes" className="text-sm font-medium">
                    Additional Notes{" "}
                    <span className="text-muted-foreground font-normal">
                      (optional)
                    </span>
                  </Label>
                  <Textarea
                    id="admin-notes"
                    name="notes"
                    placeholder="Anything else you'd like us to know…"
                    disabled={isSubmitting}
                    className="min-h-[60px] resize-none"
                  />
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 font-medium gold-gradient text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    "Submit Request"
                  )}
                </Button>
              </form>

              {/* ---------- Approval Guide (2 / 5 columns) ---------- */}
              <aside
                className="lg:col-span-2 mt-6 lg:mt-0"
                aria-label="Admin approval process guide"
              >
                <div className="bg-muted/50 rounded-lg p-5 space-y-5 border h-full">
                  <div className="space-y-1">
                    <h3 className="font-heading font-semibold text-sm text-foreground flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-primary" />
                      How It Works
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Your path from request to full admin access:
                    </p>
                  </div>

                  <ol className="space-y-4">
                    {STEPS.map((step, i) => {
                      const Icon = step.icon;
                      return (
                        <li key={step.num} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-7 h-7 rounded-full ${step.bg} ${step.text} flex items-center justify-center font-semibold text-xs`}
                            >
                              {step.num}
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className="w-px flex-1 bg-border mt-1" />
                            )}
                          </div>
                          <div className="pb-3 min-w-0 space-y-0.5">
                            <p className="font-medium text-xs text-foreground flex items-center gap-1.5">
                              <Icon
                                className={`w-3.5 h-3.5 ${step.iconColor}`}
                              />
                              {step.label}
                            </p>
                            <p className="text-[11px] leading-relaxed text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ol>

                  <div className="pt-3 border-t">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">
                        Why institution email?
                      </span>{" "}
                      An official address lets us verify your affiliation
                      quickly and protects against unauthorized access.
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminAccessModal;
