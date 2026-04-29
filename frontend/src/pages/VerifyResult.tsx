import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, XCircle, ArrowLeft, ShieldCheck, Calendar, User, Mail, Hash, Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import certifyProIcon from "@/assets/certify_pro_icon.png";
import { verifyCertificate } from "@/services/apiService";

type VerificationDetails = {
  valid: boolean;
  full_name: string;
  email: string;
  external_id: string;
  organization_name: string;
  created_at?: string | null;
  status: string;
};

const VerifyResult = () => {
  const { certId } = useParams();
  const [cert, setCert] = useState<VerificationDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadVerification = async () => {
      if (!certId) {
        if (mounted) {
          setCert(null);
          setLoading(false);
        }
        return;
      }

      try {
        const data = await verifyCertificate(certId);
        if (mounted && data?.valid) {
          setCert({
            ...data,
            organization_name: data.organization_name || "N/A",
          } as VerificationDetails);
        }
      } catch {
        if (mounted) {
          setCert(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadVerification();

    return () => {
      mounted = false;
    };
  }, [certId]);

  const isValid = !!cert?.valid;
  const issuedDate = cert?.created_at ? new Date(cert.created_at).toLocaleDateString() : "N/A";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={certifyProIcon} alt="CertifyPro Logo" className="h-6 w-6 object-contain" />
            <span className="text-lg font-heading font-bold text-foreground">CertifyPro</span>
          </div>
          <Link to="/verify">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back to Verify
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16 animate-fade-in">
        {loading ? (
          <Card className="shadow-sm">
            <CardContent className="pt-10 pb-10 text-center space-y-4">
              <Loader2 className="w-10 h-10 animate-spin text-accent mx-auto" />
              <p className="text-muted-foreground">Verifying certificate...</p>
            </CardContent>
          </Card>
        ) : isValid ? (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-success">Verified</h1>
              <p className="text-muted-foreground mt-1">This certificate is authentic and valid</p>
            </div>

            <Card className="card-shadow-lg text-left transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center shadow-sm">
                    <ShieldCheck className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issued by</p>
                    <p className="font-heading font-semibold text-foreground">CertifyPro Registry</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Certificate ID</p>
                      <p className="text-sm font-mono font-medium">{cert.external_id}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Recipient</p>
                      <p className="text-sm font-medium">{cert.full_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 col-span-2">
                    <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Organization</p>
                      <p className="text-sm font-medium">{cert.organization_name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Email</p>
                      <p className="text-sm font-medium break-all">{cert.email || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date Issued</p>
                      <p className="text-sm font-medium">{issuedDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
            <CardContent className="pt-6 pb-6 text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                <XCircle className="w-12 h-12 text-destructive" />
              </div>
              <div>
                <h1 className="text-3xl font-heading font-bold text-destructive">Invalid</h1>
                <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                  This certificate could not be verified. It may be invalid or not issued through CertifyPro.
                </p>
              </div>
              <div className="inline-flex flex-col items-center gap-1 bg-background/50 p-3 rounded-lg border border-border/50">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">Queried ID</span>
                <span className="text-sm font-mono font-medium">{certId}</span>
              </div>
              <div className="pt-2">
                <Link to="/verify">
                  <Button variant="outline" className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Try Again
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default VerifyResult;
