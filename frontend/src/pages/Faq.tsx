import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { ShieldCheck, Cpu, KeyRound, Database, Cloud, Users, Lock, FileCheck } from "lucide-react";
import React from "react";

const faqs = [
  {
    q: "How does CertifyPro ensure certificate verification is secure and tamper-proof?",
    a: `Every certificate issued through CertifyPro is cryptographically signed using institution-bound keys and a controlled signing pipeline. Verifiers check signatures against a trusted registry and immutably recorded metadata, ensuring tamper detection and source provenance without exposing private keys. We design our signing flows to minimize attack surface and to support future hardware-backed key management integrations for higher assurance.`,
  },
  {
    q: "Can certificates be validated using the QR code on the credential?",
    a: `Yes. Each public QR encodes a compact verification token and a link to a signed assertion stored in the registry. Scanning performs a cryptographic signature validation and metadata check in real time, allowing offline-friendly QR validation while preventing replay or tampering by referencing the current registry state.`,
  },
  {
    q: "Does CertifyPro support bulk certificate issuance and automation?",
    a: `We provide bulk issuance workflows with transactional guarantees and idempotent APIs so organizations can automate graduating cohorts, training completions, or large cohort imports. Jobs are processed with monitoring and retry semantics; audit logs and per-certificate status let administrators reconcile large operations without manual intervention.`,
  },
  {
    q: "How is sensitive data encrypted at rest and in transit?",
    a: `All sensitive payloads are encrypted in transit using TLS 1.2+ and at rest using proven AES encryption with application-layer key separation. Encryption keys are managed securely and rotated according to policy; we design data access controls so only authorized services and roles can decrypt certificate payloads or PII.`,
  },
  {
    q: "What admin authentication and role controls does CertifyPro offer?",
    a: `Role-based access control and multi-factor authentication are supported for administrative operations. Fine-grained permissions let institutions delegate certificate issuance, registry management, and audit review without granting full platform privileges. Login and session policies can be configured to meet enterprise security standards.`,
  },
  {
    q: "Where are registry records stored and how are they backed up?",
    a: `Registry records live in a resilient, region-aware datastore with automated backups and integrity checks. Backups are encrypted and retained per configurable retention policies; our storage architecture is optimized for verification latency while preserving strong durability guarantees for audit and compliance.`,
  },
  {
    q: "How does CertifyPro prevent credential fraud and impersonation?",
    a: `We employ cryptographic signatures, nonce-based QR tokens, anomaly detection on issuance patterns, and administrative approval gates for high-impact operations. Public verification includes provenance metadata (issuer, issuance time, revocation status) making fraudulent certificates easy to flag, and our audit trails support post-incident investigation.`,
  },
  {
    q: "Will there be an API for programmatic verification and integration?",
    a: `Yes — CertifyPro exposes a future-ready, versioned API for both issuance and verification workflows. APIs include rate-limiting, scoped API keys, and webhooks for delivery and status updates, enabling secure integrations with LMS, HR systems, and third-party verifiers while preserving governance controls.`,
  },
  {
    q: "How do institutions onboard and sync their identity data?",
    a: `Onboarding is designed to be straightforward: institutions register, configure issuer profiles, and connect their enrollment sources (CSV import, SFTP, or API). We support staged rollouts, test mode issuance, and validation checks to ensure your registry aligns with institutional records before going live.`,
  },
  {
    q: "How does CertifyPro help with data privacy and compliance obligations?",
    a: `We provide data minimization defaults, configurable consent flows, and mechanisms to export or remove personal data to comply with jurisdictional regulations. Access logs, retention controls, and encryption help organizations meet audit requirements and respond to data subject requests with verifiable provenance.`,
  },
];

const Faq: React.FC = () => {
  return (
    <main className="relative min-h-screen bg-background overflow-hidden">
      <div className="absolute inset-0 pointer-events-none flex items-start justify-center">
        <div className="absolute -top-40 w-[1100px] h-[520px] rounded-full bg-gradient-to-tr from-accent/10 via-indigo-50/5 to-transparent blur-3xl transform rotate-12" />
      </div>

      <PublicNavbar />

      <div className="max-w-6xl mx-auto px-6 py-24">
        <section className="max-w-3xl mx-auto text-center space-y-6">
          <Badge className="mx-auto">Support &amp; Help Center</Badge>
          <h1 className="text-5xl font-bold tracking-tight text-foreground">Frequently asked questions</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            Everything teams need to know about secure certificate issuance, verification, and enterprise operational controls. If you don't find what you're
            looking for, reach out to your account team for tailored help.
          </p>
        </section>

        <section className="mt-12">
          <div className="rounded-2xl bg-card/70 backdrop-blur-sm border border-border/50 shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="rounded-xl bg-card/80 border border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <ShieldCheck className="w-7 h-7 text-accent shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Enterprise-grade security</p>
                      <p className="text-sm text-muted-foreground">Designed for institutional assurance and auditability.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-xl bg-card/80 border border-border/50 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <KeyRound className="w-7 h-7 text-accent shrink-0" />
                    <div>
                      <p className="font-semibold text-foreground">Key management ready</p>
                      <p className="text-sm text-muted-foreground">Integrate with HSMs or rotate keys without downtime.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="mt-10 max-w-3xl mx-auto">
          <div className="space-y-4">
            <Accordion type="single" collapsible>
              {faqs.map((item, idx) => (
                <div
                  key={item.q}
                  className="rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 transition-colors duration-200 hover:bg-muted/40 shadow-sm"
                >
                  <AccordionItem value={`item-${idx}`} className="border-0">
                    <div className="px-6 py-4">
                      <AccordionTrigger className="text-foreground">
                        <div className="flex items-start gap-3 w-full">
                          <div className="flex-none mt-0.5 text-accent">
                            {idx === 0 && <ShieldCheck className="w-5 h-5" />}
                            {idx === 1 && <FileCheck className="w-5 h-5" />}
                            {idx === 2 && <Cpu className="w-5 h-5" />}
                            {idx === 3 && <Lock className="w-5 h-5" />}
                            {idx === 4 && <Users className="w-5 h-5" />}
                            {idx === 5 && <Database className="w-5 h-5" />}
                            {idx === 6 && <Cloud className="w-5 h-5" />}
                            {idx === 7 && <Cpu className="w-5 h-5" />}
                            {idx === 8 && <Users className="w-5 h-5" />}
                            {idx === 9 && <ShieldCheck className="w-5 h-5" />}
                          </div>
                          <div className="text-left">
                            <span className="font-medium text-foreground">{item.q}</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                      </AccordionContent>
                    </div>
                  </AccordionItem>
                </div>
              ))}
            </Accordion>
          </div>
        </section>
      </div>

      <LandingFooter />
    </main>
  );
};

export default Faq;
