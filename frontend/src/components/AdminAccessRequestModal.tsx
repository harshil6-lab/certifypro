import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Search,
  CheckCircle2,
  LogIn,
  Send,
  UserPlus,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface AdminAccessFormData {
  fullName: string;
  institution: string;
  email: string;
  role: string;
  notes: string;
}

interface FormErrors extends Partial<Record<keyof AdminAccessFormData, string>> {
  submit?: string;
}

interface AdminAccessRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/* ------------------------------------------------------------------ */
/*  Approval guide steps                                               */
/* ------------------------------------------------------------------ */

const APPROVAL_STEPS = [
  { icon: ClipboardList, label: "Submit Request" },
  { icon: Search, label: "Under Review" },
  { icon: CheckCircle2, label: "Approved" },
  { icon: LogIn, label: "Login" },
] as const;

/* ------------------------------------------------------------------ */
/*  Role options                                                       */
/* ------------------------------------------------------------------ */

const ROLE_OPTIONS = [
  "Department Admin",
  "Faculty Coordinator",
  "Registrar",
  "IT Administrator",
  "Principal / Dean",
  "Other",
] as const;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const INITIAL_FORM: AdminAccessFormData = {
  fullName: "",
  institution: "",
  email: "",
  role: "",
  notes: "",
};

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

const AdminAccessRequestModal = ({
  open,
  onOpenChange,
}: AdminAccessRequestModalProps) => {
  const [form, setForm] = useState<AdminAccessFormData>({ ...INITIAL_FORM });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ---- field change handler ---- */
  const handleChange = (field: keyof AdminAccessFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /* ---- validation ---- */
  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.institution.trim()) next.institution = "Institution is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!validateEmail(form.email)) next.email = "Enter a valid email address.";
    if (!form.role) next.role = "Please select a role.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* ---- submit ---- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      // Simulate API call delay for UX
      await new Promise((resolve) => setTimeout(resolve, 800));
      
      // TODO: POST form data to backend API
      // const response = await api.post("/admin-access-requests", form);
      // if (!response.ok) throw new Error('Submission failed');

      setSubmitted(true);
    } catch (error) {
      console.error('Submission error:', error);
      setErrors((prev) => ({ ...prev, submit: 'Failed to submit request. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ---- reset on close ---- */
  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setForm({ ...INITIAL_FORM });
      setErrors({});
      setSubmitted(false);
    }
    onOpenChange(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        {/* ---- Success state ---- */}
        {submitted ? (
          <div className="flex flex-col items-center gap-4 py-8 text-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 w-16 h-16 bg-green-500/20 rounded-full blur-xl" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 flex items-center justify-center ring-2 ring-green-200 dark:ring-green-800">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
              </div>
            </div>
            <DialogHeader className="items-center">
              <DialogTitle className="text-2xl font-bold">Request Submitted! 🎉</DialogTitle>
              <DialogDescription className="pt-2 text-base">
                Your admin access request has been received and is now under review.
              </DialogDescription>
              <p className="text-sm text-muted-foreground pt-3">
                We'll send a confirmation email to<br />
                <span className="font-semibold text-foreground">{form.email}</span>
              </p>
            </DialogHeader>
            <div className="w-full rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 text-sm text-blue-900 dark:text-blue-200 space-y-2">
              <p className="font-medium">What happens next?</p>
              <ul className="space-y-1 text-left">
                <li>✓ Your request is queued for review</li>
                <li>✓ Review typically takes 2-3 business days</li>
                <li>✓ You'll receive email notification once approved</li>
              </ul>
            </div>
            <Button
              className="mt-4 gold-gradient text-accent-foreground hover:opacity-90"
              onClick={() => handleOpenChange(false)}
            >
              Got it, thanks!
            </Button>
          </div>
        ) : (
          <>
            {/* ---- Header ---- */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="w-5 h-5" />
                Request Admin Access
              </DialogTitle>
              <DialogDescription>
                Fill in the details below to request administrator privileges.
                Your request will be reviewed by the CertifyPro team.
              </DialogDescription>
            </DialogHeader>

            {/* ---- Approval guide ---- */}
            <div className="flex items-center justify-between gap-1 rounded-lg border bg-muted/40 px-4 py-3">
              {APPROVAL_STEPS.map((step, i) => (
                <div key={step.label} className="flex items-center gap-1">
                  <div className="flex flex-col items-center gap-1 min-w-[56px]">
                    <step.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-[11px] leading-tight text-center text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                  {i < APPROVAL_STEPS.length - 1 && (
                    <div className="w-6 border-t border-dashed border-muted-foreground/40 mx-0.5" />
                  )}
                </div>
              ))}
            </div>

            {/* ---- Form ---- */}
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-fullname" className="text-sm font-semibold">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="admin-fullname"
                  placeholder="e.g., Dr. Sarah Chen"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "err-fullname" : undefined}
                  className="h-10 transition-colors focus:ring-2 focus:ring-amber-400/50"
                  disabled={isSubmitting}
                />
                {errors.fullName && (
                  <p id="err-fullname" className="text-xs text-destructive font-medium" role="alert">
                    ⚠ {errors.fullName}
                  </p>
                )}
              </div>

              {/* Institution */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-institution" className="text-sm font-semibold">
                  Institution <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="admin-institution"
                  placeholder="e.g., Harvard University"
                  value={form.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                  aria-invalid={!!errors.institution}
                  aria-describedby={errors.institution ? "err-institution" : undefined}
                  className="h-10 transition-colors focus:ring-2 focus:ring-amber-400/50"
                  disabled={isSubmitting}
                />
                {errors.institution && (
                  <p id="err-institution" className="text-xs text-destructive font-medium" role="alert">
                    ⚠ {errors.institution}
                  </p>
                )}
              </div>

              {/* Official Email */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-email" className="text-sm font-semibold">
                  Official Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="name@university.edu"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "err-email" : "hint-email"}
                  className="h-10 transition-colors focus:ring-2 focus:ring-amber-400/50"
                  disabled={isSubmitting}
                  autoComplete="email"
                />
                <p id="hint-email" className="text-xs text-muted-foreground">
                  We'll use this to confirm your request
                </p>
                {errors.email && (
                  <p id="err-email" className="text-xs text-destructive font-medium" role="alert">
                    ⚠ {errors.email}
                  </p>
                )}
              </div>

              {/* Role / Purpose */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-role" className="text-sm font-semibold">
                  Role / Purpose <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => handleChange("role", v)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id="admin-role"
                    aria-invalid={!!errors.role}
                    aria-describedby={errors.role ? "err-role" : undefined}
                    className="h-10 transition-colors focus:ring-2 focus:ring-amber-400/50"
                  >
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p id="err-role" className="text-xs text-destructive font-medium" role="alert">
                    ⚠ {errors.role}
                  </p>
                )}
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-notes" className="text-sm font-semibold">
                  Additional Notes <span className="text-muted-foreground text-xs font-normal">(optional)</span>
                </Label>
                <Textarea
                  id="admin-notes"
                  placeholder="E.g., I need access to manage certificates for our Computer Science department..."
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className="resize-none transition-colors focus:ring-2 focus:ring-amber-400/50"
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Max 500 characters ({form.notes.length}/500)
                </p>
              </div>

              {errors.submit && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3" role="alert">
                  <p className="text-sm text-red-700 dark:text-red-200">{errors.submit}</p>
                </div>
              )}

              {/* Submit */}
              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="gap-2 gold-gradient text-accent-foreground hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Request
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminAccessRequestModal;
