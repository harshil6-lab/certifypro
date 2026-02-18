import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { isAuthenticated } from "@/lib/auth";
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
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const ProtectedAdminLayout = () => {
  const location = useLocation();

  if (!isAuthenticated()) {
    const redirect = `${location.pathname}${location.search}`;
    const loginPath = `/login?reason=templates&redirect=${encodeURIComponent(redirect)}`;
    return <Navigate to={loginPath} replace />;
  }

  return <AdminLayout />;
};

const App = () => (
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
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:certId" element={<VerifyResult />} />
          <Route element={<ProtectedAdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/import" element={<ImportStudents />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/access" element={<AccessControl />} />
            <Route path="/help" element={<Help />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
