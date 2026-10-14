// Clean and well-structured routing with protected admin access and centralized auth/session handling, ensuring smooth navigation and secure user flow.
import { Suspense, lazy } from "react";
import SelectPlan from "./pages/SelectPlan";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import {
  initializeAuthSession,
  isAuthenticated,
  subscribeToAuthChanges,
} from "@/lib/auth";
import Index from "./pages/Index";
import About from "./pages/About";
import FeaturesPage from "./pages/FeaturesPage";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Registry from "./pages/Registry";
import AccessControl from "./pages/AccessControl";
import Verify from "./pages/Verify";
import VerifyResult from "./pages/VerifyResult";
import Help from "./pages/Help";
import CompleteProfile from "./pages/CompleteProfile";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import Faq from "./pages/Faq";

const queryClient = new QueryClient();

// Heavy pages split into separate chunks. Login and the admin shell stay
// eager so first paint and auth are unaffected.
const Templates = lazy(() => import("./pages/Templates"));
const DashboardTemplates = lazy(() => import("./pages/DashboardTemplates"));
const ImportStudents = lazy(() => import("./pages/ImportStudents"));
const Generate = lazy(() => import("./pages/Generate"));
const Profile = lazy(() => import("./pages/Profile"));

// Dev-only styleguide. The dynamic import sits behind import.meta.env.DEV so
// production builds eliminate the branch and exclude the page entirely.
const StyleGuidePage = import.meta.env.DEV ? lazy(() => import("./pages/dev/StyleGuide")) : null;

function LazyPage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[50vh] place-items-center text-sm text-muted-foreground">
          Loading…
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/select-plan" element={<SelectPlan />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:certId" element={<VerifyResult />} />
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/profile" element={<LazyPage><Profile /></LazyPage>} />
            <Route path="/templates" element={<LazyPage><Templates /></LazyPage>} />
            <Route path="/import" element={<LazyPage><ImportStudents /></LazyPage>} />
            <Route path="/generate" element={<LazyPage><Generate /></LazyPage>} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/access" element={<AccessControl />} />
            <Route path="/help" element={<Help />} />
          </Route>
          <Route path="/faq" element={<Faq />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          {import.meta.env.DEV && StyleGuidePage ? (
            <Route
              path="/dev/styleguide"
              element={
                <Suspense fallback={<div className="grid min-h-screen place-items-center text-sm text-muted-foreground">Loading styleguide…</div>}>
                  <StyleGuidePage />
                </Suspense>
              }
            />
          ) : null}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
