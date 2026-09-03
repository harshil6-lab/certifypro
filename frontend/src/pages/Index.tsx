import { useState } from "react";
import { Layers, QrCode, Library, Sparkles, ArrowRight, ShieldCheck, Upload, CheckCircle2, SearchCheck, BadgeCheck, Lock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CertificateGallerySection } from "@/components/landing/CertificateGallerySection";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import PublicCertificateVerificationModal from "@/components/PublicCertificateVerificationModal";

const features = [
  {
    title: "Template Library",
    description: "Start from professionally designed certificate templates for academic and corporate programs.",
    icon: Layers,
  },
  {
    title: "Bulk Generation",
    description: "Generate certificates for an entire cohort in minutes with a guided, preview-first workflow.",
    icon: Sparkles,
  },
  {
    title: "QR Verification",
    description: "Every certificate carries a unique QR reference for instant public authenticity checks.",
    icon: QrCode,
  },
  {
    title: "Certificate Registry",
    description: "Keep every issued certificate in one searchable operational workspace.",
    icon: Library,
  },
];

const workflowSteps = [
  {
    title: "Choose or upload a template",
    description: "Start with a built-in template or upload your own design and position placeholders.",
    icon: Upload,
  },
  {
    title: "Generate in bulk",
    description: "Map student or participant records and generate certificates in controlled batches.",
    icon: CheckCircle2,
  },
  {
    title: "Verify instantly",
    description: "Each certificate includes a public verification path for employers and institutions.",
    icon: SearchCheck,
  },
];

const capabilities = [
  "Bulk certificate generation from CSV",
  "Public QR-based verification",
  "Central certificate registry",
  "Role-based access control",
  "Custom and built-in templates",
];

const securityHighlights = [
  {
    title: "Tamper-resistant certificates",
    description: "Unique certificate IDs and QR verification help prevent forgery.",
    icon: ShieldCheck,
  },
  {
    title: "Data protection by design",
    description: "Secure storage practices with minimal personal-data exposure.",
    icon: Lock,
  },
  {
    title: "Verification transparency",
    description: "A public portal lets anyone confirm a certificate independently.",
    icon: SearchCheck,
  },
  {
    title: "Built for institutions",
    description: "Designed for universities, training organizations, and enterprise workflows.",
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
    answer: "The platform is designed with secure workflows, verification tracking, and a data-protection focus.",
  },
  {
    question: "Who can use CertifyPro?",
    answer: "Universities, training institutes, companies, and event organizers.",
  },
  {
    question: "Do recipients need an account?",
    answer: "No. Public verification works without login.",
  },
];

const Index = () => {
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-7xl space-y-16 px-6 py-12 md:space-y-24 md:py-16 lg:px-8">

        {/* Hero */}
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Certificate automation &amp; verification platform
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">
                Issue, verify, and manage certificates at scale
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                CertifyPro helps universities, training institutes, and organizations automate certificate
                issuance, run bulk generation, and give recipients and employers instant public verification.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link to="/login">
                <Button size="lg" className="gap-2">
                  Request access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={() => setVerificationModalOpen(true)}>
                Verify certificate
              </Button>
            </div>

            <p className="max-w-xl rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
              Access requires institutional verification. Request access to continue.
            </p>
          </div>

          {/* Certificate preview — serif here is deliberate (certificate artifact) */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-elevation-2">
            <p className="text-sm font-medium text-muted-foreground">Certificate preview</p>
            <div className="mt-4 aspect-[1.414/1] rounded-md border border-border bg-background p-6">
              <div className="flex h-full flex-col justify-between text-center">
                <div className="space-y-1.5">
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                    <BadgeCheck className="h-5 w-5" />
                  </div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    Certificate of Completion
                  </p>
                  <h3 className="font-heading text-xl font-semibold tracking-tight text-foreground">
                    Advanced Security Workshop
                  </h3>
                  <p className="text-sm text-muted-foreground">Awarded to {"{{RECIPIENT_NAME}}"}</p>
                </div>

                <div className="grid grid-cols-3 items-end gap-2 text-xs text-muted-foreground">
                  <span className="text-left">Date: {"{{ISSUE_DATE}}"}</span>
                  <div className="mx-auto h-14 w-14 rounded-md border-2 border-dashed border-border" />
                  <span className="text-right">Issuer signature</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Everything you need to issue and verify
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              A focused toolset for certificate issuance, verification, and record-keeping.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title}>
                <CardContent className="space-y-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold tracking-tight text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Certificate gallery */}
        <CertificateGallerySection />

        {/* How it works */}
        <section className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">How it works</h2>
            <p className="leading-relaxed text-muted-foreground">
              A simple workflow for secure certificate automation at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-md bg-accent/10 text-accent">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Why CertifyPro */}
        <section className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Built for teams that manage certificates at volume
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              CertifyPro began as a focused solution for academic teams handling high-volume issuance and
              verification. It is designed to scale from a first pilot to organization-wide rollout.
            </p>
            <div>
              <Link to="/features">
                <Button variant="ghost" className="gap-2 px-0 hover:bg-transparent">
                  Explore features <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          <Card>
            <CardContent className="space-y-4 p-6">
              <p className="text-sm font-medium text-foreground">Platform capabilities</p>
              <ul className="space-y-3">
                {capabilities.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Security */}
        <section className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Security</h2>
            <p className="leading-relaxed text-muted-foreground">
              CertifyPro is designed to keep certificate data protected and independently verifiable.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {securityHighlights.map((item) => (
              <div key={item.title} className="space-y-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold tracking-tight text-foreground">{item.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Frequently asked questions
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Common questions from institutions evaluating secure certificate workflows.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-card px-6">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger className="text-left text-sm font-semibold tracking-tight text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-lg border border-border bg-card p-8 text-center md:p-12">
          <div className="mx-auto max-w-2xl space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Start issuing secure certificates
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Automate certificate generation, ensure trusted verification, and streamline academic or
              corporate credential workflows.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/login">
                <Button size="lg" className="gap-2">
                  Request access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={() => setVerificationModalOpen(true)}>
                Verify certificate
              </Button>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="space-y-8">
          <div className="mx-auto max-w-2xl space-y-2 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
              Simple, transparent pricing
            </h2>
            <p className="leading-relaxed text-muted-foreground">Start free. Upgrade when you need more.</p>
          </div>

          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {/* Free */}
            <div className="space-y-6 rounded-lg border border-border bg-card p-8">
              <div>
                <p className="text-sm font-semibold text-foreground">Free</p>
                <p className="mt-1 text-4xl font-semibold text-foreground">₹0</p>
                <p className="mt-1 text-sm text-muted-foreground">Forever free</p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {["12 certificate generations", "All templates", "QR verification", "CSV student import"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block">
                <Button variant="outline" className="w-full">Get started free</Button>
              </Link>
            </div>

            {/* Pro */}
            <div className="relative space-y-6 rounded-lg border border-accent/40 bg-card p-8">
              <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-0.5 text-xs font-semibold text-accent-foreground">
                Recommended
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Pro</p>
                <p className="mt-1 text-4xl font-semibold text-foreground">
                  ₹499 <span className="text-base font-normal text-muted-foreground">/ month</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">Billed monthly</p>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {[
                  "Unlimited certificate generations",
                  "All templates",
                  "QR verification",
                  "CSV student import",
                  "Priority support",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-success" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link to="/login" className="block">
                <Button variant="accent" className="w-full">Upgrade to Pro — ₹499/mo</Button>
              </Link>
            </div>
          </div>
        </section>

        <LandingFooter />
      </main>

      <PublicCertificateVerificationModal
        open={verificationModalOpen}
        onOpenChange={setVerificationModalOpen}
      />
    </div>
  );
};

export default Index;
