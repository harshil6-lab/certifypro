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
import { useAccessControl, type AccessPermission } from "@/context/AccessControlContext";

const navItems: Array<{ title: string; url: string; icon: typeof LayoutDashboard; permission: AccessPermission }> = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { title: "Templates", url: "/templates", icon: FileImage, permission: "templates" },
  { title: "Import Students", url: "/import", icon: Upload, permission: "import_students" },
  { title: "Generate", url: "/generate", icon: Printer, permission: "generate" },
  { title: "Registry", url: "/registry", icon: List, permission: "registry" },
  { title: "Access Control", url: "/access", icon: Shield, permission: "access_control" },
];

const AdminNavbar = () => {
  const navigate = useNavigate();
  const { actor, hasPermission } = useAccessControl();
  const visibleItems = navItems.filter((item) => hasPermission(item.permission));

  const roleLabel =
    actor?.member_type === "super_admin"
      ? "Super Admin"
      : actor?.member_type === "co_admin"
        ? "Co-Admin"
        : "Admin";

  const handleSignOut = () => {
    void signOutUser();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sidebar-border bg-sidebar">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <div className="flex shrink-0 items-center pr-3">
          <img src={certifyProLogo} alt="CertifyPro" className="h-9 w-auto object-contain sm:h-10" />
        </div>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-1 xl:flex">
          {visibleItems.map((item) => (
            <NavLink
              key={item.url}
              to={item.url}
              className="group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              activeClassName="bg-sidebar-accent text-sidebar-primary ring-1 ring-sidebar-border"
            >
              <item.icon className="h-4 w-4 transition-colors group-hover:text-sidebar-primary" />
              <span className="hidden sm:inline">{item.title}</span>
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground xl:hidden"
                aria-label="Open navigation menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="border-sidebar-border bg-sidebar">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-sidebar-accent-foreground">
                  <img src={certifyProLogo} alt="CertifyPro" className="h-8 w-auto object-contain" />
                </SheetTitle>
              </SheetHeader>
              <div className="mt-8 space-y-2">
                {visibleItems.map((item) => (
                  <SheetClose key={item.url} asChild>
                    <NavLink
                      to={item.url}
                      className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent/15 text-sidebar-primary ring-1 ring-sidebar-border"
                    >
                      <item.icon className="h-5 w-5" />
                      {item.title}
                    </NavLink>
                  </SheetClose>
                ))}

                <div className="my-6 h-px bg-sidebar-border/60" />

                <SheetClose asChild>
                  <NavLink
                    to="/dashboard/profile"
                    className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground"
                    activeClassName="bg-sidebar-accent/15 text-sidebar-primary ring-1 ring-sidebar-border"
                  >
                    <UserCircle className="h-5 w-5" />
                    My Profile
                  </NavLink>
                </SheetClose>

                <SheetClose asChild>
                  <NavLink
                    to="/help"
                    className="flex items-center gap-4 rounded-lg px-4 py-3 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground"
                    activeClassName="bg-sidebar-accent/15 text-sidebar-primary ring-1 ring-sidebar-border"
                  >
                    <HelpCircle className="h-5 w-5" />
                    User Manual
                  </NavLink>
                </SheetClose>

                <div className="mt-4 border-t border-sidebar-border/60 pt-4">
                  <SheetClose asChild>
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium text-sidebar-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </SheetClose>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard/profile")}
              className="gap-2 border border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <span className="hidden whitespace-nowrap text-sm font-medium sm:inline">{roleLabel}</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-primary ring-1 ring-sidebar-border">
                <UserCircle className="h-5 w-5" />
              </div>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 border border-sidebar-border bg-sidebar-accent/30 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  aria-label="Open account menu"
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard/profile" className="flex items-center gap-2">
                    <UserCircle className="h-4 w-4" />
                    My Profile
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <NavLink to="/dashboard/profile?section=security" className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Account Settings
                  </NavLink>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <NavLink to="/" onClick={handleSignOut} className="flex items-center gap-2">
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
