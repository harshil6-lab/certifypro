import { ArrowRight, BadgeCheck, Globe, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import certifyProLogo from "@/assets/certifypro_logowithtext.png";

export function LandingFooter() {
  return (
    <footer className="mt-16 bg-gradient-to-b from-muted/35 via-muted/45 to-muted/60 border-t border-border/40">
      <div className="mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8 pt-14 md:pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-8">
          <div className="lg:col-span-4 space-y-5">
            <img src={certifyProLogo} alt="CertifyPro Logo" className="h-11 md:h-12 w-auto object-contain mb-2" />

            <p className="text-sm text-muted-foreground">Secure Certificate Automation &amp; Verification Platform</p>

            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              Built for institutions and training teams to streamline certificate issuance, automate workflows, and deliver trusted public verification experiences.
            </p>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <p className="text-sm font-semibold text-foreground">Product</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/features" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">Features</Link>
              </li>
              <li>
                <Link to="/verify" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">Verification</Link>
              </li>
              <li>
                <Link to="/login?reason=templates" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">Templates</Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <p className="text-sm font-semibold text-foreground">Company</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">Contact Us</Link>
              </li>
              <li>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">Privacy Policy</a>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <p className="text-sm font-semibold text-foreground">Resources</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">Documentation</a>
              </li>
              <li>
                <a href="#" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">FAQs</a>
              </li>
              <li>
                <Link to="/login" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">Request Access</Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <p className="text-sm font-semibold text-foreground">Get Started</p>

            <div className="space-y-2.5">
              <Link to="/login" className="block">
                <Button size="sm" className="w-full justify-between gold-gradient text-accent-foreground hover:opacity-95">
                  Request Access
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              <Link to="/verify" className="block">
                <Button size="sm" variant="outline" className="w-full justify-between">
                  Verify Certificate
                  <BadgeCheck className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a href="#" aria-label="Visit CertifyPro on LinkedIn" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors duration-200">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" aria-label="Visit CertifyPro website" className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground hover:text-foreground hover:border-border transition-colors duration-200">
                <Globe className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">© 2026 CertifyPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
