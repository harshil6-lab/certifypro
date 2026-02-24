import { useState } from "react";
import { Search, QrCode, ShieldCheck, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Card, CardContent } from "@/components/ui/card";

const Verify = () => {
  const [certId, setCertId] = useState("");
  const [result, setResult] = useState<"idle" | "verified" | "not-found">("idle");

  const handleVerify = () => {
    if (!certId.trim()) {
      return;
    }
    if (certId.trim().toUpperCase().startsWith("CERT-")) {
      setResult("verified");
      return;
    }
    setResult("not-found");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <PublicNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-14 md:py-18 text-center space-y-8 animate-fade-in">
        <div className="space-y-3">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-accent/10 flex items-center justify-center">
            <ShieldCheck className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground">
            Verify a Certificate
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Enter the certificate ID or scan the QR code to verify its authenticity.
          </p>
        </div>

        <Card className="rounded-2xl card-shadow border-border/60 max-w-xl mx-auto hover:card-shadow-lg transition-shadow">
          <CardContent className="p-6 space-y-5">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Enter Certificate ID (e.g. CERT-2024-0001)"
                className="pl-12 h-12 text-base focus:ring-2 focus:ring-accent/20 transition-all"
                value={certId}
                onChange={(e) => setCertId(e.target.value)}
              />
            </div>

            <Button
              className="w-full h-12 text-base gold-gradient text-accent-foreground hover:opacity-90 transition-opacity gap-2 shadow-md"
              disabled={!certId}
              onClick={handleVerify}
            >
              <ShieldCheck className="w-5 h-5" /> Verify Certificate
            </Button>

            <div className="rounded-xl border border-border bg-card px-4 py-4 text-left transition-colors hover:border-accent/30">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Verification Result</p>
              {result === "idle" ? (
                <p className="text-sm text-muted-foreground">Result will appear here after verification.</p>
              ) : null}
              {result === "verified" ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <p className="text-sm text-success font-medium">Certificate is valid. (Frontend mock result)</p>
                </div>
              ) : null}
              {result === "not-found" ? (
                <div className="flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" />
                  <p className="text-sm text-destructive font-medium">Certificate not found. (Frontend mock result)</p>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-3 text-muted-foreground">or</span>
          </div>
        </div>

        <div className="border-2 border-dashed border-border rounded-xl p-8 hover:border-accent/50 transition-all duration-300 cursor-pointer hover:bg-accent/5">
          <QrCode className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Scan QR code from certificate</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Camera access required</p>
        </div>

        <p className="text-xs text-muted-foreground">
          This portal verifies certificates issued through the CertifyPro system.
        </p>
      </main>

      <LandingFooter />
    </div>
  );
};

export default Verify;
