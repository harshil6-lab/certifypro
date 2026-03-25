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
import {
  ShieldCheck,
  Search,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { verifyCertificate } from "@/services/apiService";

interface PublicCertificateVerificationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VerificationState = "idle" | "loading" | "success" | "error";

interface VerificationResult {
  certificateId: string;
  issuingInstitution: string;
  recipientName: string;
  issueDate: string;
  status: "verified" | "invalid" | "revoked";
}

const PublicCertificateVerificationModal = ({
  open,
  onOpenChange,
}: PublicCertificateVerificationModalProps) => {
  const [certId, setCertId] = useState("");
  const [state, setState] = useState<VerificationState>("idle");
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!certId.trim()) {
      setError("Please enter a certificate ID");
      return;
    }

    setState("loading");
    setError("");
    
    try {
        const data = await verifyCertificate(certId.trim());

        if (!data || !data.valid) {
          throw new Error("Certificate not found");
        }

        setResult({
          certificateId: data.external_id || certId,
          issuingInstitution: "CertifyPro Registry",
          recipientName: data.full_name || "",
          issueDate: data.created_at || "",
          status: data.valid ? "verified" : "invalid",
        });

        setState("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setState("error");
    }
  };

  const handleOpenChange = (value: boolean) => {
    if (!value) {
      setCertId("");
      setError("");
      setState("idle");
      setResult(null);
    }
    onOpenChange(value);
  };

  const handleReset = () => {
    setCertId("");
    setError("");
    setState("idle");
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        {/* Success State */}
        {state === "success" && result ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 w-16 h-16 bg-green-500/20 rounded-full blur-xl" />
              <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 flex items-center justify-center ring-2 ring-green-200 dark:ring-green-800">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <DialogHeader className="items-center">
              <DialogTitle className="text-2xl">Certificate Verified ✓</DialogTitle>
              <DialogDescription>
                This certificate has been authenticated and is valid.
              </DialogDescription>
            </DialogHeader>
            <div className="w-full space-y-3 rounded-lg bg-slate-50 dark:bg-slate-900/20 p-4 text-left">
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Certificate ID:</span>
                <span className="font-medium text-foreground">{result.certificateId}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Recipient:</span>
                <span className="font-medium text-foreground">{result.recipientName}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Institution:</span>
                <span className="font-medium text-foreground text-right">{result.issuingInstitution}</span>
              </div>
              <div className="flex items-start justify-between">
                <span className="text-sm text-muted-foreground">Issued:</span>
                <span className="font-medium text-foreground">{result.issueDate}</span>
              </div>
            </div>
            <div className="flex gap-3 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={handleReset}
              >
                Verify Another
              </Button>
              <Button
                className="flex-1 gold-gradient text-accent-foreground hover:opacity-90"
                onClick={() => handleOpenChange(false)}
              >
                Close
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                Verify Certificate
              </DialogTitle>
              <DialogDescription>
                Enter a certificate ID to verify its authenticity and view details.
              </DialogDescription>
            </DialogHeader>

            {/* Trust Banner */}
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 flex gap-3">
              <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-900 dark:text-blue-200">
                This verification uses encrypted authentication. Your data is secure and private.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleVerify} className="space-y-4" noValidate>
              {/* Certificate ID Input */}
              <div className="space-y-2">
                <Label htmlFor="cert-id" className="text-sm font-semibold">
                  Certificate ID
                </Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="cert-id"
                    type="text"
                    placeholder="e.g., CERT-2024-0001"
                    value={certId}
                    onChange={(e) => {
                      setCertId(e.target.value);
                      setError("");
                    }}
                    disabled={state === "loading"}
                    className="pl-10 h-10 transition-colors focus:ring-2 focus:ring-amber-400/50"
                    autoComplete="off"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  You can find this on your certificate document or email
                </p>
              </div>

              {/* QR Option */}
              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background dark:bg-card px-3 text-muted-foreground">or</span>
                </div>
              </div>

              {/* QR Placeholder */}
              <div className="border-2 border-dashed border-border rounded-lg p-6 hover:border-amber-400/50 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors text-center cursor-pointer">
                <QrCode className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">Scan QR Code</p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Available on certificate document (coming soon)
                </p>
              </div>

              {/* Error State */}
              {error && state === "error" && (
                <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleOpenChange(false)}
                  disabled={state === "loading"}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={state === "loading" || !certId.trim()}
                  className="gap-2 gold-gradient text-accent-foreground hover:opacity-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {state === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Verify Certificate
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

export default PublicCertificateVerificationModal;
