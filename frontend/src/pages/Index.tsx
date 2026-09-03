import { useState } from "react";
import { Layers, QrCode, Library, Sparkles, ArrowRight, ShieldCheck, Upload, CheckCircle2, SearchCheck, BadgeCheck, Lock, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CertificateGallerySection } from "@/components/landing/CertificateGallerySection";
import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import PublicCertificateVerificationModal from "@/components/PublicCertificateVerificationModal";
import { CertificateTemplate } from "@/components/certificates/CertificateTemplate";
import type { CertificateDraft } from "@/components/certificates/types";

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

// Realistic sample certificate for the hero. Uses sample identities only — the
// same illustrative data pattern shipped inside the product's own preview.
const heroCertificate: CertificateDraft = {
  recipientName: "Alex Morgan",
  certificateTitle: "Advanced Data Analytics Program",
  description: "Awarded in recognition of the successful completion of all program requirements and assessments.",
  issuerSignatureText: "",
  issuerName: "Program Director",
  authoritySignatureText: "",
  authorityName: "Registrar",
  issuedDate: "September 3, 2026",
  logoName: "",
  logoPreviewUrl: "",
};

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
                  Request workspace access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" onClick={() => setVerificationModalOpen(true)}>
                Verify a certificate
              </Button>
            </div>

            <p className="max-w-xl rounded-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
              Access requires institutional verification. Request access to continue.
            </p>
          </div>

          {/* Real certificate artifact — the same renderer used inside the product */}
          <div className="relative">
            <div className="overflow-hidden rounded-xl border border-border shadow-elevation-3">
              <CertificateTemplate
                styleType="academicFormal"
                draft={heroCertificate}
                organizationName="CertifyPro Institution"
                previewScale="md"
              />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5 font-medium text-success">
                <BadgeCheck className="h-4 w-4" />
                Verified
              </span>
              <span>Certificate ID · CERT-2026-04821</span>
              <span className="inline-flex items-center gap-1.5">
                <QrCode className="h-3.5 w-3.5 text-accent" />
                QR verification enabled
              </span>
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

          <div className="grid grid-cols-1 gap-x-10 gap-y-8 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Certificate gallery — "what does the product look like" */}
        <CertificateGallerySection />

        {/* How it works */}
        <section className="space-y-8">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">How it works</h2>
            <p className="leading-relaxed text-muted-foreground">
              A simple workflow for secure certificate automation at scale.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-3">
            {/* connector line linking the three steps on desktop */}
            <div className="pointer-events-none absolute left-[16%] right-[16%] top-6 hidden h-px bg-border sm:block" aria-hidden />
            {workflowSteps.map((step, index) => (
              <div key={step.title} className="relative flex flex-col items-center text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background text-base font-semibold text-foreground shadow-sm">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="mt-4 flex items-center gap-2 text-accent">
                  <step.icon className="h-4 w-4" />
                  <h3 className="text-base font-semibold tracking-tight text-foreground">{step.title}</h3>
                </div>
                <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-muted-foreground">{step.description}</p>
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

          <div className="rounded-xl border border-border bg-muted/40 p-6 sm:p-8">
            <p className="text-sm font-medium text-foreground">Platform capabilities</p>
            <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
              {capabilities.map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Security */}
        <section className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
          <div className="max-w-md space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">Security</h2>
            <p className="leading-relaxed text-muted-foreground">
              CertifyPro is designed to keep certificate data protected and independently verifiable.
            </p>
          </div>

          <div className="divide-y divide-border">
            {securityHighlights.map((item) => (
              <div key={item.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent/10 text-accent">
                  <item.icon className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
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

          <div className="mx-auto w-full max-w-3xl border-t border-border">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={faq.question} value={`faq-${index}`}>
                  <AccordionTrigger className="py-5 text-left text-base font-semibold tracking-tight text-foreground hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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

        {/* Closing CTA */}
        <section className="rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground md:px-12 md:py-16">
          <div className="mx-auto max-w-2xl space-y-5">
            <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Start issuing secure certificates
            </h2>
            <p className="leading-relaxed text-primary-foreground/80">
              Automate certificate generation, ensure trusted verification, and streamline academic or
              corporate credential workflows.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/login">
                <Button size="lg" variant="accent" className="gap-2">
                  Request workspace access <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                onClick={() => setVerificationModalOpen(true)}
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Verify a certificate
              </Button>
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
