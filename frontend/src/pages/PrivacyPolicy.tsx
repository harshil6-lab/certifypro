import { PublicNavbar } from "@/components/landing/PublicNavbar";
import { LandingFooter } from "@/components/landing/LandingFooter";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background via-background to-muted/20">
      <PublicNavbar />

      <main className="flex-1">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Header */}
          <div className="mb-10 md:mb-12">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-foreground mb-3 tracking-tight">
              Privacy Policy — CertifyPro
            </h1>
            <p className="text-sm text-muted-foreground">
              Last Updated: 18/02/2026
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 font-sans">

            {/* Introduction */}
            <section className="bg-card/50 backdrop-blur-sm p-6 rounded-xl border border-border/50 shadow-sm">
              <p className="text-muted-foreground leading-relaxed">
                CertifyPro ("we," "our," or "us") provides a certificate automation and verification platform designed for educational institutions, training organizations, and enterprises. We are committed to protecting your privacy and ensuring transparency about how your data is collected, used, and protected.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-heading font-bold text-foreground mb-4">1. Information We Collect</h2>

              <h3 className="text-xl font-heading font-semibold text-foreground mb-3 mt-6">A. Account Information</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                When administrators or organizations register:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>Full name</li>
                <li>Institutional email address</li>
                <li>Organization details</li>
                <li>Role or designation</li>
                <li>Authentication credentials</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">B. Certificate Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                To generate and verify certificates:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>Recipient names</li>
                <li>Certificate IDs / QR codes</li>
                <li>Course or event details</li>
                <li>Issuer information</li>
                <li>Supporting documentation (if provided)</li>
              </ul>

              <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">C. Technical Data</h3>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Automatically collected:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>IP address</li>
                <li>Device/browser info</li>
                <li>Usage logs</li>
                <li>Cookies or analytics data</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                This helps maintain platform security and performance.
              </p>
            </section>

            {/* How We Use Your Data */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">2. How We Use Your Data</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We use collected information to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>Generate and manage digital certificates</li>
                <li>Enable public certificate verification</li>
                <li>Provide administrative dashboards</li>
                <li>Improve platform security and performance</li>
                <li>Prevent fraud or misuse</li>
                <li>Communicate important service updates</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4 font-semibold">
                We do NOT sell personal data.
              </p>
            </section>

            {/* Certificate Verification Data */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">3. Certificate Verification Data</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                CertifyPro enables public verification of certificates.
              </p>
              <p className="text-muted-foreground leading-relaxed mb-3">
                This may expose limited information such as:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>Certificate holder name</li>
                <li>Issuing institution</li>
                <li>Certificate status</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                This visibility exists solely to ensure authenticity.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security Measures</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We implement industry-standard protections including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>Secure encrypted connections (HTTPS/SSL)</li>
                <li>Controlled access authentication</li>
                <li>Secure storage practices</li>
                <li>Regular security reviews</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                However, no system guarantees absolute security.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">5. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We retain certificate and user data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>As long as the account remains active</li>
                <li>For verification integrity</li>
                <li>To comply with legal obligations</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Users may request deletion subject to verification requirements.
              </p>
            </section>

            {/* Third-Party Services */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">6. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                CertifyPro may integrate with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>Authentication providers (Google, etc.)</li>
                <li>Cloud hosting providers</li>
                <li>Analytics tools</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                These providers maintain their own privacy policies.
              </p>
            </section>

            {/* User Responsibilities */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">7. User Responsibilities</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Organizations using CertifyPro must:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>Provide accurate certificate data</li>
                <li>Obtain consent before uploading personal information</li>
                <li>Use the platform ethically</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Misuse may lead to account suspension.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">8. Cookies & Tracking</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We may use cookies for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>Authentication sessions</li>
                <li>Performance analytics</li>
                <li>User experience improvements</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Users can control cookies via browser settings.
              </p>
            </section>

            {/* Legal Compliance */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">9. Legal Compliance</h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We aim to align with:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground leading-relaxed">
                <li>GDPR-style data protection principles</li>
                <li>Educational data protection norms</li>
                <li>General digital security standards</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3 italic">
                (Adjust later if legally required.)
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                CertifyPro is not intended for minors without institutional supervision.
              </p>
            </section>

            {/* Updates to Policy */}
            <section>
              <h2 className="text-2xl font-bold text-foreground mb-4">11. Changes to Policy</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                We may update this Privacy Policy periodically.
                Updated versions will appear on this page.
              </p>
            </section>

            {/* Contact Information */}
            <section className="bg-muted/30 border border-border/40 rounded-lg p-6 mt-8">
              <h2 className="text-2xl font-bold text-foreground mb-4">12. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                For privacy concerns:
              </p>
              <div className="space-y-3 text-muted-foreground">
                <p className="text-lg font-semibold text-foreground">📧 Contact Team ElevateX</p>
                <p><strong className="text-foreground">Email:</strong></p>
                <ul className="list-none pl-0 space-y-1 text-sm">
                  <li>
                    <a href="mailto:24ce049@charusat.edu.in" className="text-primary hover:underline">
                      24ce049@charusat.edu.in
                    </a>
                  </li>
                  <li>
                    <a href="mailto:24ce066@charusat.edu.in" className="text-primary hover:underline">
                      24ce066@charusat.edu.in
                    </a>
                  </li>
                  <li>
                    <a href="mailto:24ce061@charusat.edu.in" className="text-primary hover:underline">
                      24ce061@charusat.edu.in
                    </a>
                  </li>
                  <li>
                    <a href="mailto:24ce069@charusat.edu.in" className="text-primary hover:underline">
                      24ce069@charusat.edu.in
                    </a>
                  </li>
                </ul>
              </div>
            </section>

          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default PrivacyPolicy;
