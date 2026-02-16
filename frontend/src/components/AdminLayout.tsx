import { Outlet } from "react-router-dom";
import AdminNavbar from "./AdminNavbar";

export function AdminLayout() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <AdminNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
