import { useState } from "react";
import { CheckCircle2, Clock, FileCheck, Zap } from "lucide-react";
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

interface AdminAccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AdminAccessModal = ({ open, onOpenChange }: AdminAccessModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Request submitted",
        description: "Your admin access request has been received. You'll hear from us within 1-2 business days.",
      });
      setIsSubmitting(false);
      event.currentTarget.reset();
      onOpenChange(false);
    }, 800);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="text-2xl font-heading">Request Admin Access</DialogTitle>
          <DialogDescription className="text-base">
            For institutions that need administrator access to manage certificates and verification
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 py-6">
          {/* Form Section */}
          <div className="lg:col-span-1">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="admin-name" className="font-medium">
                  Full Name
                </Label>
                <Input
                  id="admin-name"
                  name="name"
                  autoComplete="name"
                  required
                  placeholder="Your full name"
                  disabled={isSubmitting}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-institution" className="font-medium">
                  Institution
                </Label>
                <Input
                  id="admin-institution"
                  name="institution"
                  autoComplete="organization"
                  required
                  placeholder="University / College / Organization"
                  disabled={isSubmitting}
                  className="h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email" className="font-medium">
                  Official Email
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
                />
                <p className="text-xs text-muted-foreground">
                  Use an institution-issued address for verification
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-purpose" className="font-medium">
                  Role / Purpose
                </Label>
                <Textarea
                  id="admin-purpose"
                  name="purpose"
                  required
                  placeholder="e.g., Registrar office admin, Certificate coordinator, IT administrator"
                  disabled={isSubmitting}
                  className="min-h-24 resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 font-medium gold-gradient text-accent-foreground hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </div>

          {/* User Guide Section */}
          <div className="lg:col-span-2">
            <div className="bg-muted/50 rounded-lg p-6 space-y-6 border">
              <div>
                <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
                  Approval Flow Guide
                </h3>
                <p className="text-sm text-muted-foreground mb-5">
                  Here's what happens after you submit your request:
                </p>
              </div>

              <div className="space-y-4">
                {/* Step 1 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-sm">
                      1
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-sm text-foreground flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-blue-600" />
                      Initial Review
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Our team verifies your institutional email and details (24 hours)
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-semibold text-sm">
                      2
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-sm text-foreground flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Verification
                    </p>
                    <p className="text-xs text-muted-foreground">
                      We confirm your role within your organization (24–48 hours)
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-semibold text-sm">
                      3
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-sm text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-green-600" />
                      Activation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your admin account is activated with full access (instant)
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-sm">
                      4
                    </div>
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-medium text-sm text-foreground flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" />
                      Confirmation
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You'll receive a welcome email with login credentials and onboarding
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info Box */}
              <div className="pt-4 border-t space-y-3">
                <p className="text-xs font-medium text-foreground uppercase tracking-wider">
                  Why institution email?
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Using an official institution-issued email helps us verify your affiliation and protect against unauthorized admin access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAccessModal;
