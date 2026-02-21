import { NavLink } from "@/components/NavLink";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ChevronDown,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  FileImage,
  Upload,
  Printer,
  List,
  Shield,
  UserCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import certifyProLogo from "@/assets/white_certify_pro_logo.png";
import { signOutUser } from "@/lib/auth";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Templates", url: "/templates", icon: FileImage },
  { title: "Import Students", url: "/import", icon: Upload },
  { title: "Generate", url: "/generate", icon: Printer },
  { title: "Registry", url: "/registry", icon: List },
  { title: "Access Control", url: "/access", icon: Shield },
];

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleSignOut = () => {
    void signOutUser();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-700 bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <div className="flex items-center shrink-0 pr-3">
          <img src={certifyProLogo} alt="CertifyPro Logo" className="h-9 sm:h-10 w-auto object-contain" />
        </div>

        <nav className="hidden xl:flex flex-1 min-w-0 items-center justify-center gap-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:bg-white/10 hover:text-white"
              activeClassName="bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50 shadow-sm"
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center justify-end gap-3 shrink-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="xl:hidden text-slate-300 hover:bg-white/10 hover:text-white hover:border-slate-600"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-700">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-white">
                  <img src={certifyProLogo} alt="CertifyPro Logo" className="h-8 w-auto object-contain" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {navItems.map((item) => (
                  <SheetClose key={item.url} asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                      activeClassName="bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.title}
                    </NavLink>
                  </SheetClose>
                ))}

                <div className="my-3 h-px bg-slate-700" />

                <SheetClose asChild>
                  <NavLink
                    to="/dashboard/profile"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                    activeClassName="bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50"
                  >
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink
                    to="/dashboard/profile?section=security"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                  >
                    <Shield className="h-4 w-4" />
                    Account Settings
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink
                    to="/help"
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                    activeClassName="bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/50"
                  >
                    <HelpCircle className="h-4 w-4" />
                    User Manual
                  </NavLink>
                </SheetClose>
                <SheetClose asChild>
                  <NavLink
                    to="/"
                    onClick={handleSignOut}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </NavLink>
                </SheetClose>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => navigate("/dashboard/profile")}
              className="gap-2 px-3 py-2 rounded-lg border border-slate-600 bg-white/5 hover:bg-white/15 text-slate-200 hover:text-white transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <span className="hidden sm:inline text-sm font-medium whitespace-nowrap">Admin</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 ring-1 ring-amber-400/50 text-amber-300">
                <UserCircle className="h-5 w-5" />
              </div>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 border border-slate-600 bg-white/5 text-slate-300 hover:bg-white/15 hover:text-white"
                  aria-label="Open account menu"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard/profile" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/10">
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard/profile?section=security" className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/10">
                    <Shield className="h-4 w-4" />
                    Account Settings
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-slate-700" />
                <DropdownMenuItem asChild>
                  <NavLink to="/" onClick={handleSignOut} className="flex items-center gap-2 text-slate-300 hover:text-white hover:bg-white/10">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </NavLink>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
