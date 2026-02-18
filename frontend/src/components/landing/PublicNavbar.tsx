import { Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import certifyProLogo from "@/assets/certifypro_logowithtext.png";
import certifyProIcon from "@/assets/certify_pro_icon.png";

const navItems = [
  { label: "Home", to: "/" },
  { label: "About Us", to: "/about" },
  { label: "Features", to: "/features" },
  { label: "Templates", to: "/login?reason=templates" },
  { label: "Contact Us", to: "/contact" },
  { label: "Verify Certificate", to: "/verify" },
];

export function PublicNavbar() {
  const location = useLocation();

  const isItemActive = (to: string) => {
    if (to === "/") {
      return location.pathname === "/";
    }

    if (to === "/verify") {
      return location.pathname.startsWith("/verify");
    }

    if (to.startsWith("/login?reason=templates")) {
      const params = new URLSearchParams(location.search);
      return location.pathname === "/login" && params.get("reason") === "templates";
    }

    return location.pathname === to;
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/90 backdrop-blur-lg shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
      <div className="mx-auto w-full max-w-7xl px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center pr-2 group" aria-label="Go to CertifyPro Home">
          <img src={certifyProLogo} alt="CertifyPro Logo" className="h-10 md:h-11 lg:h-12 w-auto object-contain" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8 xl:gap-10">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              aria-current={isItemActive(item.to) ? "page" : undefined}
              className={`relative text-sm transition-colors duration-300 after:absolute after:left-0 after:-bottom-1 after:h-0.5 after:w-full after:origin-left after:bg-accent after:transition-transform after:duration-300 after:ease-out ${
                isItemActive(item.to)
                  ? "text-foreground after:scale-x-100"
                  : "text-foreground/80 hover:text-foreground after:scale-x-0 hover:after:scale-x-100"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2 shrink-0">
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
                  <img src={certifyProIcon} alt="CertifyPro Logo" className="h-5 w-5 object-contain" />
                  CertifyPro
                </SheetTitle>
              </SheetHeader>

              <div className="mt-6 space-y-3">
                {navItems.map((item) => (
                  <SheetClose asChild key={item.label}>
                    <Link
                      to={item.to}
                      aria-current={isItemActive(item.to) ? "page" : undefined}
                      className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                        isItemActive(item.to)
                          ? "bg-muted text-foreground"
                          : "text-foreground/80 hover:bg-muted hover:text-foreground"
                      }`}
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
