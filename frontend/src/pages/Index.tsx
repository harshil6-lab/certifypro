import { Award, Layers, QrCode, Library, Sparkles, ArrowRight, ShieldCheck, Quote, Upload, CheckCircle2, SearchCheck, Menu, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrustedInstitutionsSection } from "@/components/landing/TrustedInstitutionsSection";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";

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

const navItems = [
  { label: "About Us", href: "#about" },
  { label: "Features", href: "#features" },
  { label: "Templates", to: "/templates" },
  { label: "Contact Us", href: "#contact" },
  { label: "Verify Certificate", to: "/verify" },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-lg shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
              <Award className="w-5 h-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-lg font-heading font-bold text-foreground">CertifyPro</p>
              <p className="text-xs text-muted-foreground">Certificate Automation Platform</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) =>
              item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className="relative text-sm text-foreground/80 hover:text-foreground transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.to ?? "/"}
                  className="relative text-sm text-foreground/80 hover:text-foreground transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
                >
                  {item.label}
                </Link>
              ),
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Link to="/login" className="hidden sm:block">
              <Button size="sm" className="gold-gradient text-accent-foreground shadow-[0_8px_20px_rgba(217,169,56,0.25)] hover:opacity-95">
                Login / Request Access
              </Button>
            </Link>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] sm:w-[420px]">
                <SheetHeader>
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                      <Award className="w-4 h-4 text-accent-foreground" />
                    </div>
                    CertifyPro
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-3">
                  {navItems.map((item) =>
                    item.href ? (
                      <SheetClose asChild key={item.label}>
                        <a href={item.href} className="block rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors">
                          {item.label}
                        </a>
                      </SheetClose>
                    ) : (
                      <SheetClose asChild key={item.label}>
                        <Link to={item.to ?? "/"} className="block rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors">
                          {item.label}
                        </Link>
                      </SheetClose>
                    ),
                  )}

                  <div className="pt-2">
                    <SheetClose asChild>
                      <Link to="/login">
                        <Button className="w-full gold-gradient text-accent-foreground">Login / Request Access</Button>
                      </Link>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16 md:space-y-20">
        <section className="relative rounded-2xl overflow-hidden border border-border/60 card-shadow-lg">
          <img
            src={heroImage}
            alt="Professional certificate ceremony"
            className="absolute inset-0 h-full w-full object-cover scale-105 blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/88 to-background/78" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center p-7 sm:p-10">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                Trusted workflow for modern institutions
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight text-foreground">
                  Certify, Verify, and Scale with Confidence
                </h1>
                <p className="text-base md:text-lg text-foreground/80 max-w-xl leading-relaxed">
                  CertifyPro is a modern SaaS platform for certificate automation, large-batch issuance, and secure verification experiences trusted by institutions and training organizations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link to="/login">
                  <Button className="gold-gradient text-accent-foreground gap-2 shadow-[0_10px_24px_rgba(217,169,56,0.3)] hover:opacity-95">
                    Request Access <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/verify">
                  <Button variant="outline" className="bg-background/80">Verify Certificate</Button>
                </Link>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-2 rounded-2xl bg-gradient-to-tr from-accent/25 via-transparent to-primary/20 blur-xl" />
              <Card className="relative rotate-[1.5deg] card-shadow-lg border-border/60 overflow-hidden bg-card/95 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4">
                  <p className="text-sm font-semibold text-foreground">Certificate Preview</p>
                  <div className="aspect-[1.414/1] rounded-xl border border-border/70 bg-white/80 dark:bg-card p-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(43_90%_52%_/_0.08),transparent_65%)]" />
                    <div className="relative z-10 h-full flex flex-col justify-between text-center">
                      <div className="space-y-1.5">
                        <div className="mx-auto w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                          <BadgeCheck className="w-5 h-5 text-accent-foreground" />
                        </div>
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Certificate of Professional Completion</p>
                        <h3 className="text-xl font-heading font-bold text-foreground">Advanced Security Workshop</h3>
                        <p className="text-sm text-muted-foreground">Awarded to {"{{RECIPIENT_NAME}}"}</p>
                      </div>

                      <div className="grid grid-cols-3 items-end text-xs text-muted-foreground gap-2">
                        <span className="text-left">Date: {"{{ISSUE_DATE}}"}</span>
                        <div className="mx-auto w-16 h-16 rounded-md border-2 border-dashed border-accent/70 bg-accent/5" />
                        <span className="text-right">Issuer Signature</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section id="features" className="space-y-7">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Platform Features</h2>
            <p className="text-muted-foreground">Production-ready frontend modules prepared for backend integration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feature) => (
              <Card key={feature.title} className="group rounded-2xl card-shadow border-border/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:card-shadow-lg hover:border-accent/40">
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

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="space-y-7">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">How It Works</h2>
            <p className="text-muted-foreground">A simple workflow for secure certificate automation at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {workflowSteps.map((step, index) => (
              <Card key={step.title} className="rounded-2xl card-shadow border-border/60">
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

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section id="about" className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">Built for institutions that care about trust and speed</h2>
            <p className="text-muted-foreground leading-relaxed">
              CertifyPro started as a focused solution for academic teams managing high-volume issuance and verification requests. The platform is designed with a modular, backend-ready frontend architecture so teams can scale from pilot to enterprise rollout with confidence.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-lg font-heading font-bold text-foreground">70%+</p>
                <p className="text-xs text-muted-foreground">Faster issuance workflows</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-lg font-heading font-bold text-foreground">99.9%</p>
                <p className="text-xs text-muted-foreground">Verification reliability target</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/60 overflow-hidden card-shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
              alt="Team collaborating on digital certification workflow"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="space-y-7">
          <TrustedInstitutionsSection />

          <Card className="rounded-2xl card-shadow border-border/60">
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

        <footer id="contact" className="pt-6 pb-10 border-t border-border/70">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg gold-gradient flex items-center justify-center">
                  <Award className="w-4 h-4 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">CertifyPro</p>
                  <p className="text-xs text-muted-foreground">Certificate Automation SaaS</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Launch-ready platform experience for secure certificate issuing and verification.
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Product</p>
              <div className="space-y-2 text-sm">
                <a href="#features" className="block text-muted-foreground hover:text-foreground transition-colors">Features</a>
                <Link to="/templates" className="block text-muted-foreground hover:text-foreground transition-colors">Templates</Link>
                <Link to="/verify" className="block text-muted-foreground hover:text-foreground transition-colors">Verification</Link>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Company</p>
              <div className="space-y-2 text-sm">
                <a href="#about" className="block text-muted-foreground hover:text-foreground transition-colors">About</a>
                <a href="#contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Resources</p>
              <div className="space-y-2 text-sm">
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">Docs</a>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors">FAQs</a>
                <Link to="/login" className="block text-muted-foreground hover:text-foreground transition-colors">Request Access</Link>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-border/60 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <p>© {new Date().getFullYear()} CertifyPro. All rights reserved.</p>
            <p>Frontend preview • React + Tailwind + shadcn</p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
