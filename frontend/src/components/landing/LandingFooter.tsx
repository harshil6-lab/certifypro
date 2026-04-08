import { ArrowRight, BadgeCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import certifyProLogo from "@/assets/certifypro_logowithtext.png";

export function LandingFooter() {
  return (
    <footer className="mt-16 bg-slate-50 border-t border-slate-200">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 pt-14 md:pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-10 lg:gap-10">
          <div className="lg:col-span-4 space-y-5">
            <img src={certifyProLogo} alt="CertifyPro Logo" className="h-12 md:h-14 w-auto object-contain mb-2" />

            <p className="text-sm text-slate-600 leading-relaxed">Secure Certificate Automation &amp; Verification Platform</p>

            <p className="text-sm text-slate-600 leading-relaxed max-w-md">
              Built for institutions and training teams to streamline certificate issuance, automate workflows, and deliver trusted public verification experiences.
            </p>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <p className="text-sm font-semibold text-foreground">Product</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/features" className="block text-slate-600 hover:text-foreground transition-colors duration-200">Features</Link>
              </li>
              <li>
                <Link to="/verify" className="block text-slate-600 hover:text-foreground transition-colors duration-200">Verification</Link>
              </li>
              <li>
                <Link to="/login?reason=templates" className="block text-slate-600 hover:text-foreground transition-colors duration-200">Templates</Link>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-2 space-y-4">
            <p className="text-sm font-semibold text-foreground">Company</p>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/about" className="block text-slate-600 hover:text-foreground transition-colors duration-200">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="block text-slate-600 hover:text-foreground transition-colors duration-200">Contact Us</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="block text-slate-600 hover:text-foreground transition-colors duration-200">Privacy Policy</Link>
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
                <Link to="/faq" className="block text-muted-foreground hover:text-foreground transition-colors duration-200">FAQs</Link>
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

          </div>
        </div>

        <div className="mt-10 pt-5 border-t border-slate-200">
          <p className="text-xs text-slate-500 text-center">© 2026 CertifyPro. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
