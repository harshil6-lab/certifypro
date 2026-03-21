import { useEffect, useState } from "react";
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
import Templates from "./pages/Templates";
import ImportStudents from "./pages/ImportStudents";
import Generate from "./pages/Generate";
import Registry from "./pages/Registry";
import AccessControl from "./pages/AccessControl";
import Verify from "./pages/Verify";
import VerifyResult from "./pages/VerifyResult";
import Help from "./pages/Help";
import Profile from "./pages/Profile";
import CompleteProfile from "./pages/CompleteProfile";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

type ProtectedAdminLayoutProps = {
  ready: boolean;
  authenticated: boolean;
  firstLoginRequired: boolean;
};

const ProtectedAdminLayout = ({
  ready,
  authenticated,
  firstLoginRequired,
}: ProtectedAdminLayoutProps) => {
  const location = useLocation();

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-sm text-muted-foreground">
        Restoring session...
      </div>
    );
  }

  if (!authenticated) {
    const redirect = `${location.pathname}${location.search}`;
    const loginPath = `/login?reason=templates&redirect=${encodeURIComponent(redirect)}`;
    return <Navigate to={loginPath} replace />;
  }

  if (
    firstLoginRequired &&
    !(location.pathname === "/dashboard/profile" && location.search.includes("section=security"))
  ) {
    return <Navigate to="/dashboard/profile?section=security&firstLogin=1" replace />;
  }

  return <AdminLayout />;
};

const App = () => {
  const [authReady, setAuthReady] = useState(false);
  const [authenticated, setAuthenticatedState] = useState(isAuthenticated());
  const [firstLoginRequired, setFirstLoginRequired] = useState(false);

  useEffect(() => {
    let mounted = true;

    const bootAuth = async () => {
      const restored = await initializeAuthSession();
      if (mounted) {
        setAuthenticatedState(restored.authenticated);
        setFirstLoginRequired(restored.firstLoginRequired);
        setAuthReady(true);
      }
    };

    void bootAuth();

    const unsubscribe = subscribeToAuthChanges((nextAuthenticated, _event, nextFirstLogin) => {
      if (mounted) {
        setAuthenticatedState(nextAuthenticated);
        setFirstLoginRequired(nextFirstLogin);
      }
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/login" element={<Login />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/verify/:certId" element={<VerifyResult />} />
            <Route
              element={(
                <ProtectedAdminLayout
                  ready={authReady}
                  authenticated={authenticated}
                  firstLoginRequired={firstLoginRequired}
                />
              )}
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/templates" element={<Templates />} />
              <Route path="/import" element={<ImportStudents />} />
              <Route path="/generate" element={<Generate />} />
              <Route path="/registry" element={<Registry />} />
              <Route path="/access" element={<AccessControl />} />
              <Route path="/help" element={<Help />} />
              <Route path="/dashboard/profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
