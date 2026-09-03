import { ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import certifyProLogo from "@/assets/certifypro_logowithtext.png";

export function LandingFooter() {
  return (
    <footer className="border-t border-border bg-muted">
      <div className="mx-auto w-full max-w-7xl px-6 pb-8 pt-14 md:pt-16 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
          <div className="space-y-5 lg:col-span-4">
            <img src={certifyProLogo} alt="CertifyPro" className="mb-2 h-12 w-auto object-contain md:h-14" />

            <p className="text-sm leading-relaxed text-muted-foreground">
              Secure certificate automation &amp; verification platform
            </p>

            <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
              Built for institutions and training teams to streamline certificate issuance, automate workflows,
              and deliver trusted public verification.
            </p>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <p className="text-sm font-semibold text-foreground">Product</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/features" className="block text-muted-foreground transition-colors hover:text-foreground">Features</Link>
              </li>
              <li>
                <Link to="/verify" className="block text-muted-foreground transition-colors hover:text-foreground">Verification</Link>
              </li>
              <li>
                <Link to="/login?reason=templates" className="block text-muted-foreground transition-colors hover:text-foreground">Certificate templates</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <p className="text-sm font-semibold text-foreground">Company</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="block text-muted-foreground transition-colors hover:text-foreground">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="block text-muted-foreground transition-colors hover:text-foreground">Contact Us</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="block text-muted-foreground transition-colors hover:text-foreground">Privacy Policy</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <p className="text-sm font-semibold text-foreground">Resources</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/faq" className="block text-muted-foreground transition-colors hover:text-foreground">FAQs</Link>
              </li>
              <li>
                <Link to="/login" className="block text-muted-foreground transition-colors hover:text-foreground">Request workspace access</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <p className="text-sm font-semibold text-foreground">Get Started</p>

            <div className="space-y-2.5">
              <Link to="/login" className="block">
                <Button size="sm" className="w-full justify-between">
                  Request workspace access
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>

              <Link to="/verify" className="block">
                <Button size="sm" variant="outline" className="w-full justify-between">
                  Verify a certificate
                  <BadgeCheck className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-5">
          <p className="text-center text-xs text-muted-foreground">© 2026 CertifyPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
