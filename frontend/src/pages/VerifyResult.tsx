import { useParams, Link } from "react-router-dom";
import { Award, CheckCircle2, XCircle, ArrowLeft, ShieldCheck, Calendar, User, BookOpen, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const validCerts: Record<string, { name: string; course: string; date: string; institution: string; certId: string }> = {
  "CERT-2024-0001": { name: "Alice Johnson", course: "B.Sc. Computer Science", date: "June 15, 2024", institution: "National University", certId: "CERT-2024-0001" },
  "CERT-2024-0002": { name: "Bob Smith", course: "M.A. Economics", date: "June 15, 2024", institution: "National University", certId: "CERT-2024-0002" },
};

const VerifyResult = () => {
  const { certId } = useParams();
  const cert = certId ? validCerts[certId] : null;
  const isValid = !!cert;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
              <Award className="w-5 h-5 text-accent-foreground" />
            </div>
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
        {isValid ? (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-success" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-success">Verified</h1>
              <p className="text-muted-foreground mt-1">This certificate is authentic and valid</p>
            </div>

            <Card className="card-shadow-lg text-left">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b">
                  <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issued by</p>
                    <p className="font-heading font-semibold text-foreground">{cert.institution}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Certificate ID</p>
                      <p className="text-sm font-mono font-medium">{cert.certId}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Recipient</p>
                      <p className="text-sm font-medium">{cert.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Program</p>
                      <p className="text-sm font-medium">{cert.course}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date Issued</p>
                      <p className="text-sm font-medium">{cert.date}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-destructive">Invalid</h1>
              <p className="text-muted-foreground mt-1">
                This certificate could not be verified. It may be invalid or not issued through CertifyPro.
              </p>
            </div>
            <p className="text-sm font-mono text-muted-foreground bg-muted p-3 rounded-lg">
              Queried ID: {certId}
            </p>
            <Link to="/verify">
              <Button variant="outline" className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Try Again
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
};

export default VerifyResult;
