import { Award, Layers, QrCode, Library, Sparkles, ArrowRight, ShieldCheck, Quote, Upload, CheckCircle2, SearchCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustedInstitutionsSection } from "@/components/landing/TrustedInstitutionsSection";

const heroImage =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80";

const features = [
  {
    title: "Template Library",
    description: "Use professionally designed certificate templates for academic and enterprise use cases.",
    icon: Layers,
    image:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Bulk Generation",
    description: "Generate hundreds of certificates in minutes with guided workflows and mock-ready previewing.",
    icon: Sparkles,
    image:
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "QR Verification",
    description: "Attach unique QR references to every certificate for quick public authenticity checks.",
    icon: QrCode,
    image:
      "https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=900&q=80",
  },
  {
    title: "Certificate Registry",
    description: "Manage certificate records in one operational workspace built for compliance-ready expansion.",
    icon: Library,
    image:
      "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=900&q=80",
  },
];

const workflowSteps = [
  {
    title: "Upload or Choose Template",
    description: "Start with curated templates or upload your own design with placeholder positioning.",
    icon: Upload,
  },
  {
    title: "Generate in Bulk",
    description: "Map student or participant records and generate certificates in controlled batches.",
    icon: CheckCircle2,
  },
  {
    title: "Verify Instantly",
    description: "Each certificate includes secure verification paths for employers and institutions.",
    icon: SearchCheck,
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Award className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-lg font-heading font-bold text-foreground">CertifyPro</p>
              <p className="text-xs text-muted-foreground">Certificate Automation Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/verify">
              <Button variant="outline" size="sm">Verify Certificate</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="gold-gradient text-accent-foreground">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-14 space-y-16">
        <section className="relative rounded-3xl overflow-hidden border border-border/60 card-shadow-lg">
          <img
            src={heroImage}
            alt="Professional certificate ceremony"
            className="absolute inset-0 h-full w-full object-cover scale-105 blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/88 to-background/78" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center p-7 sm:p-10">
            <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-accent" />
              Trusted workflow for modern institutions
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight text-foreground">
                Automate Certificate Issuing &amp; Verification
              </h1>
              <p className="text-base md:text-lg text-foreground/80 max-w-xl leading-relaxed">
                CertifyPro helps institutions issue secure certificates, manage registry records, and deliver instant verification experiences with a clean, backend-ready SaaS frontend.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button className="gold-gradient text-accent-foreground gap-2">
                  Request Access <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline">Login</Button>
              </Link>
              <Link to="/verify">
                <Button variant="outline">Verify Certificate</Button>
              </Link>
            </div>
            </div>

            <Card className="card-shadow-lg border-border/60 overflow-hidden bg-card/95 backdrop-blur-sm">
              <CardContent className="p-6 space-y-4">
                <p className="text-sm font-semibold text-foreground">Demo Certificate Preview</p>
                <div className="aspect-[1.414/1] rounded-xl border border-dashed border-border bg-muted/40 p-6 relative overflow-hidden">
                  <div className="absolute inset-0 seal-pattern" />
                  <div className="relative z-10 h-full flex flex-col justify-between text-center">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Certificate of Completion</p>
                      <h3 className="text-xl font-heading font-bold text-foreground">Advanced Security Workshop</h3>
                      <p className="text-sm text-muted-foreground">Awarded to {"{{RECIPIENT_NAME}}"}</p>
                    </div>

                    <div className="flex items-end justify-between text-xs text-muted-foreground">
                      <span>Date: {"{{ISSUE_DATE}}"}</span>
                      <div className="w-16 h-16 rounded-md border-2 border-dashed border-accent/70 bg-accent/5" />
                      <span>Issuer Signature</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Platform Features</h2>
            <p className="text-muted-foreground">Production-ready frontend modules prepared for backend integration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feature) => (
              <Card key={feature.title} className="group card-shadow border-border/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:card-shadow-lg hover:border-accent/40">
                <div className="aspect-[16/8] w-full overflow-hidden">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <CardContent className="p-5 space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center transition-colors group-hover:bg-accent/20">
                    <feature.icon className="w-5 h-5 text-accent" />
                  </div>
                  <p className="font-semibold text-foreground">{feature.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground">A simple workflow for secure certificate automation at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {workflowSteps.map((step, index) => (
              <Card key={step.title} className="card-shadow border-border/60">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-accent" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
                  </div>
                  <p className="text-base font-semibold text-foreground">{step.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Built for institutions that care about trust and speed</h2>
            <p className="text-muted-foreground leading-relaxed">
              CertifyPro started as a focused solution for academic teams managing high-volume issuance and verification requests. The platform is designed with a modular, backend-ready frontend architecture so teams can scale from pilot to enterprise rollout with confidence.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-lg font-heading font-bold text-foreground">70%+</p>
                <p className="text-xs text-muted-foreground">Faster issuance workflows</p>
              </div>
              <div className="rounded-lg border border-border bg-card p-3">
                <p className="text-lg font-heading font-bold text-foreground">99.9%</p>
                <p className="text-xs text-muted-foreground">Verification reliability target</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 overflow-hidden card-shadow">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
              alt="Team collaborating on digital certification workflow"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </section>

        <section className="space-y-6">
          <TrustedInstitutionsSection />

          <Card className="card-shadow border-border/60">
            <CardContent className="p-6 sm:p-7">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Quote className="w-5 h-5 text-accent" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm sm:text-base text-foreground leading-relaxed">
                      “CertifyPro reduced manual certificate processing time by over 70% while improving verification trust for employers and partner institutions.”
                    </p>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Operations Lead</p>
                      <p className="text-xs text-muted-foreground">Regional Education Consortium</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                    <Quote className="w-5 h-5 text-accent" />
                  </div>
                  <div className="space-y-3">
                    <p className="text-sm sm:text-base text-foreground leading-relaxed">
                      “The verification-first approach gave our compliance team immediate confidence during audits and partner checks.”
                    </p>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Director of Programs</p>
                      <p className="text-xs text-muted-foreground">PrimeSkills Academy</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <footer className="pt-2 pb-8 border-t border-border/70">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
                <Award className="w-4 h-4 text-accent-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">CertifyPro</p>
                <p className="text-xs text-muted-foreground">Secure Certificate Automation & Verification</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="outline" size="sm">Request Access</Button>
              </Link>
              <Link to="/verify">
                <Button size="sm" className="gold-gradient text-accent-foreground">Verify Now</Button>
              </Link>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
