import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";
import { AccessControlProvider, useAccessControl } from "@/context/AccessControlContext";

function AdminLayoutShell() {
  const { ready, loading, actor, canAccessPath } = useAccessControl();
  const pathname = window.location.pathname;

  if (!ready || loading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <AdminNavbar />
        <main className="grid flex-1 place-items-center text-sm text-muted-foreground">
          Loading access controls...
        </main>
      </div>
    );
  }

  if (actor?.status === "removed") {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <AdminNavbar />
        <main className="grid flex-1 place-items-center px-6">
          <div className="max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-foreground">Administrator access removed</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This account can still sign in, but administrator pages are no longer available.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!canAccessPath(pathname)) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-background">
        <AdminNavbar />
        <main className="grid flex-1 place-items-center px-6">
          <div className="max-w-lg rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
            <h1 className="text-lg font-semibold text-foreground">Permission required</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your current access level does not include this module.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AdminNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminLayout() {
  return (
    <AccessControlProvider>
      <AdminLayoutShell />
    </AccessControlProvider>
  );
}
