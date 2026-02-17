import { Award, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { label: "About Us", to: "/about" },
  { label: "Features", to: "/features" },
  { label: "Templates", to: "/login?reason=templates" },
  { label: "Contact Us", to: "/contact" },
  { label: "Verify Certificate", to: "/verify" },
];

export function PublicNavbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-lg shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center">
            <Award className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <p className="text-lg font-heading font-bold text-foreground leading-none">CertifyPro</p>
            <p className="text-xs text-muted-foreground mt-1">Certificate Automation Platform</p>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="relative text-sm text-foreground/80 hover:text-foreground transition-colors after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link to="/login" className="hidden sm:block">
            <Button size="sm" className="gold-gradient text-accent-foreground shadow-[0_8px_20px_rgba(217,169,56,0.25)] hover:opacity-95">
              Login / Request Access
            </Button>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] sm:w-[420px]">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
                    <Award className="w-4 h-4 text-accent-foreground" />
                  </div>
                  CertifyPro
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-3">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <Link
                      to={item.to}
                      className="block rounded-lg px-3 py-2 text-sm text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}

                <div className="pt-2">
                  <SheetClose asChild>
                    <Link to="/login">
                      <Button className="w-full gold-gradient text-accent-foreground">Login / Request Access</Button>
                    </Link>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
