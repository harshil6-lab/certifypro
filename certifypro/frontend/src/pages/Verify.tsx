import { useState } from "react";
import { Award, Search, QrCode, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link } from "react-router-dom";

const Verify = () => {
  const [certId, setCertId] = useState("");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
              <Award className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className="text-lg font-heading font-bold text-foreground">CertifyPro</span>
          </div>
          <span className="text-sm text-muted-foreground">Public Verification Portal</span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 py-20 text-center space-y-8 animate-fade-in">
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

        {/* Input */}
        <div className="max-w-md mx-auto space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Enter Certificate ID (e.g. CERT-2024-0001)"
              className="pl-12 h-12 text-base"
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
            />
          </div>

          <Link to={certId ? `/verify/${certId}` : "#"}>
            <Button
              className="w-full h-12 text-base gold-gradient text-accent-foreground hover:opacity-90 gap-2"
              disabled={!certId}
            >
              <ShieldCheck className="w-5 h-5" /> Verify Certificate
            </Button>
          </Link>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">or</span>
            </div>
          </div>

          <div className="border-2 border-dashed border-border rounded-xl p-8 hover:border-accent/50 transition-colors cursor-pointer">
            <QrCode className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Scan QR code from certificate</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Camera access required</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          This portal verifies certificates issued through the CertifyPro system.
        </p>
      </main>
    </div>
  );
};

export default Verify;
