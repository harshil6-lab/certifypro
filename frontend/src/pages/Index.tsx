import { Layers, QrCode, Library, Sparkles, ArrowRight, ShieldCheck, Quote, Upload, CheckCircle2, SearchCheck, BadgeCheck, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { TrustedInstitutionsSection } from "@/components/landing/TrustedInstitutionsSection";
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {features.map((feature) => (
              <Card key={feature.title} className="group rounded-2xl card-shadow border-border/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:card-shadow-lg hover:border-accent/40">
                <div className="aspect-[16/8] w-full overflow-hidden bg-gradient-to-br from-primary/5 to-accent/10 p-3 sm:p-4">
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="h-full w-full rounded-xl object-contain shadow-[0_10px_24px_rgba(13,27,58,0.12)] transition-transform duration-500 group-hover:scale-105"
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

        <section className="space-y-7 bg-slate-50 p-5 sm:p-6 rounded-2xl">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">How It Works</h2>
            <p className="text-slate-600 leading-relaxed">A simple workflow for secure certificate automation at scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <step.icon className="w-5 h-5 text-accent" />
                  </div>
                  <span className="text-xs font-medium text-slate-500">Step {index + 1}</span>
                </div>
                <p className="text-base font-semibold tracking-tight text-foreground">{step.title}</p>
                <p className="text-sm text-slate-600 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center bg-white p-5 sm:p-6 rounded-2xl">
          <div className="space-y-4">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">Built for institutions that care about trust and speed</h2>
            <p className="text-slate-600 leading-relaxed">
              CertifyPro started as a focused solution for academic teams managing high-volume issuance and verification requests. The platform is designed with a modular, backend-ready frontend architecture so teams can scale from pilot to enterprise rollout with confidence.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-lg font-heading font-bold text-foreground">70%+</p>
                <p className="text-xs text-slate-600">Faster issuance workflows</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="text-lg font-heading font-bold text-foreground">99.9%</p>
                <p className="text-xs text-slate-600">Verification reliability target</p>
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

        <section className="space-y-7 bg-slate-50 p-5 sm:p-6 rounded-2xl">
          <TrustedInstitutionsSection />

          <div className="rounded-2xl bg-white p-6 sm:p-7">
            <div className="space-y-2 mb-6">
              <h3 className="text-xl sm:text-2xl font-heading font-semibold tracking-tight text-foreground">Expected Impact for Institutions</h3>
              <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
                Here’s how institutions and training teams are expected to benefit from CertifyPro once deployed.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Quote className="w-5 h-5 text-accent" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    “As faculty coordinators, we expect CertifyPro to significantly reduce manual certificate work and improve verification trust for students and employers.”
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Academic Program Coordinator</p>
                    <p className="text-xs text-slate-500">Expected Use Case</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Quote className="w-5 h-5 text-accent" />
                </div>
                <div className="space-y-3">
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                    “The verification-first workflow should help institutions maintain credibility and simplify certificate audits.”
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Training Institute Faculty</p>
                    <p className="text-xs text-slate-500">Projected Feedback</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="space-y-7 bg-white p-5 sm:p-6 rounded-2xl">
          <div className="space-y-2 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">Security &amp; Compliance</h2>
            <p className="text-slate-600 leading-relaxed">
              CertifyPro ensures secure certificate issuance, trusted verification, and data protection aligned with institutional standards.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
            {securityHighlights.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">{item.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="space-y-7 bg-slate-50 p-5 sm:p-6 rounded-2xl">
          <div className="space-y-2 text-center max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-heading font-semibold tracking-tight text-foreground">Frequently Asked Questions</h2>
            <p className="text-slate-600 leading-relaxed">
              Common questions from institutions and teams evaluating secure certificate workflows.
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 bg-white px-5 sm:px-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`} className="border-slate-200">
                  <AccordionTrigger className="text-left text-sm sm:text-base font-semibold tracking-tight text-foreground hover:no-underline hover:text-accent transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-slate-600 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <div className="h-px w-full bg-gradient-to-r from-transparent via-border to-transparent" />

        <section className="rounded-2xl bg-gradient-to-b from-slate-50 to-white p-8 sm:p-10 text-center border border-slate-200 space-y-5">
          <h2 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground">
            Start Issuing Secure Certificates Today
          </h2>
          <p className="text-slate-600 leading-relaxed max-w-3xl mx-auto">
            Automate certificate generation, ensure trusted verification, and streamline academic or corporate credential workflows.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-3 pt-1">
            <Link to="/login">
              <Button className="gold-gradient text-accent-foreground gap-2 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-lg hover:opacity-95">
                Request Access <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/verify">
              <Button variant="outline" className="bg-white border-slate-300 text-foreground hover:bg-slate-50 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md">
                Verify Certificate
              </Button>
            </Link>
          </div>
        </section>

        <LandingFooter />
      </main>
    </div>
  );
};

export default Index;
