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
  const [errors, setErrors] = useState<Partial<Record<keyof AdminAccessFormData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  /* ---- field change handler ---- */
  const handleChange = (field: keyof AdminAccessFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /* ---- validation ---- */
  const validate = (): boolean => {
    const next: Partial<Record<keyof AdminAccessFormData, string>> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required.";
    if (!form.institution.trim()) next.institution = "Institution is required.";
    if (!form.email.trim()) next.email = "Email is required.";
    else if (!validateEmail(form.email)) next.email = "Enter a valid email address.";
    if (!form.role) next.role = "Please select a role.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  /* ---- submit ---- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    // TODO: POST form data to backend API
    // await api.post("/admin-access-requests", form);

    setSubmitted(true);
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
          <div className="flex flex-col items-center gap-4 py-6 text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-green-600 dark:text-green-400" />
            </div>
            <DialogHeader className="items-center">
              <DialogTitle className="text-xl">Request Submitted</DialogTitle>
              <DialogDescription>
                Your admin access request has been received. You'll be notified
                at <span className="font-medium text-foreground">{form.email}</span> once
                it's reviewed.
              </DialogDescription>
            </DialogHeader>
            <Button
              variant="outline"
              className="mt-2"
              onClick={() => handleOpenChange(false)}
            >
              Close
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
                <Label htmlFor="admin-fullname">
                  Full Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="admin-fullname"
                  placeholder="John Doe"
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  aria-invalid={!!errors.fullName}
                  aria-describedby={errors.fullName ? "err-fullname" : undefined}
                  className="h-10"
                />
                {errors.fullName && (
                  <p id="err-fullname" className="text-xs text-destructive" role="alert">
                    {errors.fullName}
                  </p>
                )}
              </div>

              {/* Institution */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-institution">
                  Institution <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="admin-institution"
                  placeholder="University / College name"
                  value={form.institution}
                  onChange={(e) => handleChange("institution", e.target.value)}
                  aria-invalid={!!errors.institution}
                  aria-describedby={errors.institution ? "err-institution" : undefined}
                  className="h-10"
                />
                {errors.institution && (
                  <p id="err-institution" className="text-xs text-destructive" role="alert">
                    {errors.institution}
                  </p>
                )}
              </div>

              {/* Official Email */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">
                  Official Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="you@institution.edu"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "err-email" : undefined}
                  className="h-10"
                />
                {errors.email && (
                  <p id="err-email" className="text-xs text-destructive" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Role / Purpose */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-role">
                  Role / Purpose <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => handleChange("role", v)}
                >
                  <SelectTrigger
                    id="admin-role"
                    aria-invalid={!!errors.role}
                    aria-describedby={errors.role ? "err-role" : undefined}
                    className="h-10"
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
                  <p id="err-role" className="text-xs text-destructive" role="alert">
                    {errors.role}
                  </p>
                )}
              </div>

              {/* Optional Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="admin-notes">Additional Notes (optional)</Label>
                <Textarea
                  id="admin-notes"
                  placeholder="Any additional context for your access request…"
                  value={form.notes}
                  onChange={(e) => handleChange("notes", e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              {/* Submit */}
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="gap-2 gold-gradient text-accent-foreground hover:opacity-90 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                  Submit Request
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
