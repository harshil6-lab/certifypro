import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FileImage,
  Upload,
  Printer,
  List,
  Shield,
  HelpCircle,
  LogOut,
} from "lucide-react";
import { signOutUser } from "@/lib/auth";
import certifyProIcon from "@/assets/certify_pro_icon.png";

const navItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Templates", url: "/templates", icon: FileImage },
  { title: "Import Students", url: "/import", icon: Upload },
  { title: "Generate", url: "/generate", icon: Printer },
  { title: "Registry", url: "/registry", icon: List },
  { title: "Access Control", url: "/access", icon: Shield },
];

export function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
            <img src={certifyProIcon} alt="CertifyPro Logo" className="h-5 w-5 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-sidebar-accent-foreground tracking-tight">
              CertifyPro
            </h1>
            <p className="text-xs text-sidebar-muted">Certificate Authority</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-xs font-medium text-sidebar-muted uppercase tracking-wider px-3 mb-3">
          Management
        </p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              }`}
            >
              <item.icon className={`w-4 h-4 ${isActive ? "text-sidebar-primary" : ""}`} />
              {item.title}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-sidebar-border space-y-1">
        <NavLink
          to="/help"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
          Help & Manual
        </NavLink>
        <NavLink
          to="/"
          onClick={() => {
            void signOutUser();
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </NavLink>
      </div>
    </aside>
  );
}
