import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, ArrowRight, X } from "lucide-react";

interface OnboardingData {
  role: string;
  organization: string;
  discoveredVia: string;
  intendedUse: string;
}

interface ProfileOnboardingModalProps {
  isOpen: boolean;
  onComplete: (data: OnboardingData) => void;
  onSkip: () => void;
}

const roleOptions = [
  { value: "educator", label: "Educator / School Administrator" },
  { value: "registrar", label: "University Registrar" },
  { value: "it_director", label: "IT Director / Technical Lead" },
  { value: "compliance", label: "Compliance / Quality Assurance" },
  { value: "operations", label: "Operations Manager" },
  { value: "executive", label: "Executive / Leadership" },
  { value: "other", label: "Other" },
];

const discoveryOptions = [
  { value: "search", label: "Search Engine" },
  { value: "recommendation", label: "Colleague Recommendation" },
  { value: "industry_event", label: "Industry Event / Conference" },
  { value: "social_media", label: "Social Media" },
  { value: "article", label: "Article / Blog" },
  { value: "demo", label: "Demo Request" },
  { value: "other", label: "Other" },
];

const useOptions = [
  { value: "certificates", label: "Digital Certificate Issuance" },
  { value: "verification", label: "Certificate Verification" },
  { value: "bulk", label: "Bulk Certificate Management" },
  { value: "integration", label: "Enterprise System Integration" },
  { value: "compliance", label: "Compliance & Audit Trail" },
  { value: "multiple", label: "Multiple Use Cases" },
];

export function ProfileOnboardingModal({
  isOpen,
  onComplete,
  onSkip,
}: ProfileOnboardingModalProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(isOpen);
  const [formData, setFormData] = useState<OnboardingData>({
    role: "",
    organization: "",
    discoveredVia: "",
    intendedUse: "",
  });

  // Sync external isOpen state with internal open state
  useEffect(() => {
    setOpen(isOpen);
  }, [isOpen]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
    }
  }, [open]);

  const handleNext = () => {
    if (step === 1 && !formData.role) return;
    if (step === 2 && !formData.organization.trim()) return;
    if (step === 3 && !formData.discoveredVia) return;
    if (step === 4 && !formData.intendedUse) return;

    if (step < 4) {
      setStep(step + 1);
    } else {
      submitForm();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const submitForm = () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      onComplete(formData);
      setOpen(false);
    }, 500);
  };

  const isStepComplete = (): boolean => {
    switch (step) {
      case 1:
        return formData.role !== "";
      case 2:
        return formData.organization.trim() !== "";
      case 3:
        return formData.discoveredVia !== "";
      case 4:
        return formData.intendedUse !== "";
      default:
        return true;
    }
  };

  const progressPercent = (step / 4) * 100;

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) {
        onSkip();
      }
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-border/60 bg-gradient-to-br from-background to-background/95 backdrop-blur-sm">
        {/* Close button */}
        <button
          onClick={onSkip}
          className="absolute right-4 top-4 p-1 rounded-lg hover:bg-muted transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-border rounded-t-lg overflow-hidden">
          <div
            className="h-full gold-gradient transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <DialogHeader className="pt-4">
          <DialogTitle className="text-2xl font-heading font-bold">
            {step === 1 && "What's your role?"}
            {step === 2 && "Tell us about your organization"}
            {step === 3 && "How did you discover CertifyPro?"}
            {step === 4 && "What will you use CertifyPro for?"}
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground/80 mt-2">
            {step === 1 && "This helps us tailor your experience and provide better support."}
            {step === 2 && "We use this to understand your institutional context."}
            {step === 3 && "Your feedback helps us improve our marketing and outreach."}
            {step === 4 && "This information helps us prioritize features for your needs."}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div className="space-y-6 py-6">
          {/* Step 1: Role Selection */}
          {step === 1 && (
            <div className="space-y-3">
              {roleOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, role: option.value })}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.role === option.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{option.label}</span>
                    {formData.role === option.value && (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Organization */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  Institution or Company Name
                </label>
                <Input
                  value={formData.organization}
                  onChange={(e) =>
                    setFormData({ ...formData, organization: e.target.value })
                  }
                  placeholder="e.g., Harvard University, Microsoft Corp"
                  className="h-12 border-2 border-border focus:border-accent/50"
                  autoFocus
                />
              </div>
              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <p className="text-xs text-muted-foreground/70">
                  <strong>Tip:</strong> We use this to understand the scale and type of institutions using CertifyPro.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Discovery */}
          {step === 3 && (
            <div className="space-y-3">
              {discoveryOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, discoveredVia: option.value })}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.discoveredVia === option.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{option.label}</span>
                    {formData.discoveredVia === option.value && (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Intended Use */}
          {step === 4 && (
            <div className="space-y-3">
              {useOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFormData({ ...formData, intendedUse: option.value })}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                    formData.intendedUse === option.value
                      ? "border-accent bg-accent/5"
                      : "border-border hover:border-accent/30 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{option.label}</span>
                    {formData.intendedUse === option.value && (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
          <div className="text-xs text-muted-foreground/60 font-medium">
            Step {step} of 4
          </div>

          <div className="flex gap-3">
            {step > 1 && (
              <Button
                onClick={handleBack}
                variant="outline"
                className="border-2 border-border hover:border-muted-foreground/50"
              >
                Back
              </Button>
            )}

            <Button
              onClick={handleNext}
              disabled={!isStepComplete() || isLoading}
              className="gap-2 gold-gradient text-accent-foreground hover:shadow-lg hover:shadow-amber-500/30 disabled:opacity-50"
            >
              {step === 4 ? (
                <>
                  {isLoading ? "Completing..." : "Complete Onboarding"}
                  <CheckCircle2 className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Skip option */}
        <div className="text-center pt-2">
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
          >
            Skip for now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
