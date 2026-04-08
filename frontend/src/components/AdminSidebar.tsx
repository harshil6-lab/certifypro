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
import { useAccessControl, type AccessPermission } from "@/context/AccessControlContext";

const navItems: Array<{ title: string; url: string; icon: typeof LayoutDashboard; permission: AccessPermission }> = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, permission: "dashboard" },
  { title: "Templates", url: "/templates", icon: FileImage, permission: "templates" },
  { title: "Import Students", url: "/import", icon: Upload, permission: "import_students" },
  { title: "Generate", url: "/generate", icon: Printer, permission: "generate" },
  { title: "Registry", url: "/registry", icon: List, permission: "registry" },
  { title: "Access Control", url: "/access", icon: Shield, permission: "access_control" },
];

export function AdminSidebar() {
  const location = useLocation();
  const { hasPermission } = useAccessControl();
  const visibleItems = navItems.filter((item) => hasPermission(item.permission));

  return (
    <aside className="w-64 min-h-screen bg-sidebar flex flex-col border-r border-sidebar-border shadow-xl z-20 transition-all duration-300">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl gold-gradient flex items-center justify-center shadow-lg shadow-accent/20 transition-transform group-hover:scale-105">
            <img src={certifyProIcon} alt="CertifyPro Logo" className="h-5 w-5 object-contain" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-sidebar-accent-foreground tracking-tight group-hover:text-white transition-colors">
              CertifyPro
            </h1>
            <p className="text-xs text-sidebar-muted">Certificate Authority</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        <p className="text-xs font-bold text-sidebar-muted uppercase tracking-wider px-4 mb-3 mt-2">
          Management
        </p>

        {visibleItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <NavLink
              key={item.url}
              to={item.url}
              className={`group flex items-center gap-3.5 px-4 py-3 rounded-lg text-[15px] font-medium transition-all duration-200 ${isActive
                ? "bg-sidebar-accent/15 text-sidebar-primary shadow-sm border border-sidebar-border/60 translate-x-1"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground hover:translate-x-1"
                }`}
            >
              <item.icon className={`w-5 h-5 transition-colors ${isActive ? "text-sidebar-primary" : "text-sidebar-muted/80 group-hover:text-sidebar-primary"}`} />
              {item.title}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-sidebar-primary shadow-lg shadow-primary/50" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-sidebar-border space-y-1 bg-sidebar/30">
        <NavLink
          to="/help"
          className="group flex items-center gap-3.5 px-4 py-3 rounded-lg text-[15px] font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/10 hover:text-sidebar-accent-foreground transition-all duration-200"
        >
          <HelpCircle className="w-5 h-5 text-sidebar-muted/80 group-hover:text-sidebar-primary transition-colors" />
          Help & Manual
        </NavLink>
        <button
          onClick={() => {
            void signOutUser();
          }}
          className="w-full group flex items-center gap-3.5 px-4 py-3 rounded-lg text-[15px] font-medium text-sidebar-foreground/80 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="w-5 h-5 text-sidebar-muted/80 group-hover:text-destructive transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
