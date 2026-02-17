import { Award } from "lucide-react";
import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="pt-6 pb-10 border-t border-border/70 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
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
            Frontend-ready product experience for modern institutions issuing and verifying certificates at scale.
          </p>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Product</p>
          <div className="space-y-2 text-sm">
            <Link to="/features" className="block text-muted-foreground hover:text-foreground transition-colors">Features</Link>
            <Link to="/login?reason=templates" className="block text-muted-foreground hover:text-foreground transition-colors">Templates</Link>
            <Link to="/verify" className="block text-muted-foreground hover:text-foreground transition-colors">Verification</Link>
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Company</p>
          <div className="space-y-2 text-sm">
            <Link to="/about" className="block text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/contact" className="block text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-8 pt-4 border-t border-border/60 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <p>© {new Date().getFullYear()} CertifyPro. All rights reserved.</p>
        <p>Frontend preview • React + Tailwind + shadcn</p>
      </div>
    </footer>
  );
}
