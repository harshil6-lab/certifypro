import { Layers, QrCode, Library, Sparkles, ArrowRight, ShieldCheck, Quote, Upload, CheckCircle2, SearchCheck, BadgeCheck, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TrustedInstitutionsSection } from "@/components/landing/TrustedInstitutionsSection";
import { CertificateGallerySection } from "@/components/landing/CertificateGallerySection";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import templateLibraryVisual from "@/assets/features/template-library.svg";
import bulkGenerationVisual from "@/assets/features/bulk-generation.svg";
import qrVerificationVisual from "@/assets/features/qr-verification.svg";
import certificateRegistryVisual from "@/assets/features/certificate-registry.svg";

const heroImage =
  "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1600&q=80";

const features = [
  {
    title: "Template Library",
    description: "Use professionally designed certificate templates for academic and enterprise use cases.",
    icon: Layers,
    image: templateLibraryVisual,
  },
  {
    title: "Bulk Generation",
    description: "Generate hundreds of certificates in minutes with guided workflows and mock-ready previewing.",
    icon: Sparkles,
    image: bulkGenerationVisual,
  },
  {
    title: "QR Verification",
    description: "Attach unique QR references to every certificate for quick public authenticity checks.",
    icon: QrCode,
    image: qrVerificationVisual,
  },
  {
    title: "Certificate Registry",
    description: "Manage certificate records in one operational workspace built for compliance-ready expansion.",
    icon: Library,
    image: certificateRegistryVisual,
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

const securityHighlights = [
  {
    title: "Tamper-Proof Certificates",
    description: "Unique IDs with QR-based verification help prevent certificate fraud.",
    icon: ShieldCheck,
  },
  {
    title: "Data Protection & Privacy",
    description: "Secure storage practices and minimal personal data exposure by design.",
    icon: Lock,
  },
  {
    title: "Verification Transparency",
    description: "Public certificate validation portal with audit-friendly verification logs.",
    icon: SearchCheck,
  },
  {
    title: "Institution-Ready Infrastructure",
    description: "Built for universities, training organizations, and enterprise-scale workflows.",
    icon: Library,
  },
];

const faqs = [
  {
    question: "How are certificates verified?",
    answer: "Each certificate includes a unique ID and QR verification link for authenticity.",
  },
  {
    question: "Can institutions upload their own templates?",
    answer: "Yes. Admins can upload custom certificate templates or use built-in designs.",
  },
  {
    question: "Is CertifyPro secure?",
    answer: "Platform designed with secure workflows, verification tracking, and data protection focus.",
  },
  {
    question: "Who can use CertifyPro?",
    answer: "Universities, training institutes, companies, event organizers.",
  },
  {
    question: "Do recipients need an account?",
    answer: "No. Public verification works without login.",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16 space-y-16 md:space-y-20">

        <section className="relative rounded-2xl overflow-hidden border border-slate-200 bg-gradient-to-b from-white to-slate-50">
          <img
            src={heroImage}
            alt="Professional certificate ceremony"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-slate-50/85" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center p-7 sm:p-10">
            <div className="space-y-6 animate-hero-enter">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs text-slate-600">
                <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                Trusted workflow for modern institutions
              </div>

              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-semibold tracking-tight leading-tight text-foreground">
                  Certify, Verify, and Scale with Confidence
                </h1>
                <p className="text-base md:text-lg text-slate-600 max-w-xl leading-relaxed">
                  CertifyPro is a modern SaaS platform for certificate automation, large-batch issuance, and secure verification experiences trusted by institutions and training organizations.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link to="/login">
                  <Button className="gold-gradient text-accent-foreground gap-2 shadow-md ring-1 ring-yellow-100 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:opacity-95">
                    Request Access <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link to="/verify">
                  <Button variant="outline" className="bg-white shadow-sm ring-1 ring-slate-200 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">Verify Certificate</Button>
                </Link>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 max-w-xl">
                Access requires institutional verification. Request access to continue.
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 rounded-2xl bg-yellow-100/20 blur-2xl opacity-60" />
              <div className="relative rotate-[2deg] md:rotate-[3deg] transition-all duration-300 ease-out hover:rotate-0 hover:scale-105">
                <div className="relative rounded-2xl border border-slate-200 bg-white shadow-xl hover:shadow-2xl [--float-rotate:0deg] animate-[float_6s_ease-in-out_infinite]">
                  <div className="p-6 space-y-4">
                    <p className="text-sm font-semibold tracking-tight text-foreground">Certificate Preview</p>
                    <div className="aspect-[1.414/1] rounded-xl border border-slate-200 bg-white p-6 relative overflow-hidden">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,hsl(43_90%_52%_/_0.06),transparent_65%)]" />
                      <div className="relative z-10 h-full flex flex-col justify-between text-center">
                        <div className="space-y-1.5">
                          <div className="mx-auto w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
                            <BadgeCheck className="w-5 h-5 text-accent-foreground" />
                          </div>
                          <p className="text-xs uppercase tracking-wider text-slate-500">Certificate of Professional Completion</p>
                          <h3 className="text-xl font-heading font-semibold tracking-tight text-foreground">Advanced Security Workshop</h3>
                          <p className="text-sm text-slate-600">Awarded to {"{{RECIPIENT_NAME}}"}</p>
                        </div>

                        <div className="grid grid-cols-3 items-end text-xs text-slate-500 gap-2">
                          <span className="text-left">Date: {"{{ISSUE_DATE}}"}</span>
                          <div className="mx-auto w-16 h-16 rounded-md border-2 border-dashed border-accent/70 bg-accent/5" />
                          <span className="text-right">Issuer Signature</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="space-y-7 bg-white p-5 sm:p-6 rounded-2xl">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">Platform Features</h2>
            <p className="text-slate-600 leading-relaxed">Production-ready frontend modules prepared for backend integration.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="group rounded-2xl card-shadow border-border/60 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-accent/40 bg-card">
                <div className="aspect-[16/8] w-full overflow-hidden bg-gradient-to-br from-primary/5 to-accent/10 p-4 sm:p-5 relative">
                  <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,black,rgba(0,0,0,0.6))]" />
                  <div className="relative h-full w-full rounded-xl overflow-hidden shadow-lg transition-transform duration-500 group-hover:scale-[1.02]">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <CardContent className="p-6 space-y-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 transition-colors group-hover:bg-accent/20">
                    <feature.icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-foreground tracking-tight">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mt-1">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <CertificateGallerySection />

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="space-y-7 bg-slate-50/50 p-5 sm:p-6 rounded-2xl">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">How It Works</h2>
            <p className="text-slate-600 leading-relaxed">A simple workflow for secure certificate automation at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="group relative rounded-2xl border border-border bg-card p-6 space-y-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                    <step.icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">Step {index + 1}</span>
                </div>
                <div>
                  <h3 className="text-lg font-heading font-semibold tracking-tight text-foreground">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-card p-6 sm:p-8 rounded-2xl border border-border/50 shadow-sm overflow-hidden">
          <div className="space-y-6 order-2 lg:order-1">
            <h2 className="text-3xl font-heading font-bold tracking-tight text-foreground sm:text-4xl">
              Built for institutions that care about trust <span className="text-accent">&</span> speed
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              CertifyPro started as a focused solution for academic teams managing high-volume issuance and verification requests. The platform is designed with a modular, backend-ready frontend architecture so teams can scale from pilot to enterprise rollout with confidence.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="rounded-xl border border-border bg-background p-5 hover:border-accent/40 transition-colors">
                <p className="text-3xl font-heading font-bold text-foreground">70%<span className="text-accent text-xl">+</span></p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Faster issuance workflows</p>
              </div>
              <div className="rounded-xl border border-border bg-background p-5 hover:border-accent/40 transition-colors">
                <p className="text-3xl font-heading font-bold text-foreground">99.9%</p>
                <p className="text-sm font-medium text-muted-foreground mt-1">Verification reliability target</p>
              </div>
            </div>

            <div className="pt-2">
              <Button variant="ghost" className="group gap-2 px-0 hover:bg-transparent hover:text-accent">
                Read our deployment guide <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
          </div>
          <div className="order-1 lg:order-2 relative rounded-2xl overflow-hidden shadow-2xl transition-transform hover:scale-[1.02] duration-500">
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
            <img
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
              alt="Students collaborating"
              className="h-full w-full object-cover aspect-video"
              loading="lazy"
            />
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="space-y-7 bg-slate-50/50 p-5 sm:p-6 rounded-2xl">
          <TrustedInstitutionsSection />

          <div className="rounded-2xl bg-card p-6 sm:p-8 border border-border/50 shadow-sm transition-all hover:shadow-md">
            <div className="space-y-2 mb-8">
              <h3 className="text-xl sm:text-2xl font-heading font-semibold tracking-tight text-foreground">Expected Impact for Institutions</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-3xl">
                Here’s how institutions and training teams are expected to benefit from CertifyPro once deployed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 transition-colors hover:bg-muted/50">
                <div className="h-10 w-10 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
                  <Quote className="h-5 w-5 text-accent" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed italic">
                    “As faculty coordinators, we expect CertifyPro to significantly reduce manual certificate work and improve verification trust for students and employers.”
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Academic Program Coordinator</p>
                    <p className="text-xs text-muted-foreground">Expected Use Case</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-muted/30 transition-colors hover:bg-muted/50">
                <div className="h-10 w-10 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
                  <Quote className="h-5 w-5 text-accent" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm sm:text-base text-foreground/80 leading-relaxed italic">
                    “The verification-first workflow should help institutions maintain credibility and simplify certificate audits.”
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Training Institute Faculty</p>
                    <p className="text-xs text-muted-foreground">Projected Feedback</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="space-y-7 bg-card p-5 sm:p-6 rounded-2xl border border-border/50 shadow-sm">
          <div className="space-y-2 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">Security &amp; Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              CertifyPro ensures secure certificate issuance, trusted verification, and data protection aligned with institutional standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {securityHighlights.map((item) => (
              <div key={item.title} className="group rounded-xl border border-border bg-muted/30 p-5 space-y-3 transition-all hover:bg-muted/50 hover:border-accent/30 hover:shadow-sm">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="space-y-7 bg-slate-50/50 p-5 sm:p-6 rounded-2xl">
          <div className="space-y-2 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">Frequently Asked Questions</h2>
            <p className="text-slate-600 leading-relaxed">
              Common questions from institutions and teams evaluating secure certificate workflows.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-2xl border border-border bg-card px-5 sm:px-6 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`} className="border-border/50">
                  <AccordionTrigger className="text-left text-sm sm:text-base font-semibold tracking-tight text-foreground hover:no-underline hover:text-accent transition-colors py-4">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="rounded-2xl bg-gradient-to-b from-card to-background p-8 sm:p-12 text-center border border-border/60 shadow-lg space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(43,90%,50%,0.05),transparent_50%)]" />
          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl md:text-5xl font-heading font-bold tracking-tight text-foreground drop-shadow-sm">
              Start Issuing Secure Certificates Today
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed max-w-3xl mx-auto">
              Automate certificate generation, ensure trusted verification, and streamline academic or corporate credential workflows.
            </p>

            <div className="flex flex-wrap justify-center items-center gap-4 pt-2">
              <Link to="/login">
                <Button size="lg" className="gold-gradient text-accent-foreground gap-2 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-accent/20">
                  Request Access <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/verify">
                <Button size="lg" variant="outline" className="bg-background/50 backdrop-blur-sm border-border hover:bg-muted/50 transition-all duration-300 hover:scale-105">
                  Verify Certificate
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <LandingFooter />
      </main >
    </div >
  );
};

export default Index;
