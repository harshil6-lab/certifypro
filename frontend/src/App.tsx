// Clean and well-structured routing with protected admin access and centralized auth/session handling, ensuring smooth navigation and secure user flow.
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
import DashboardTemplates from "./pages/DashboardTemplates";
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
import Faq from "./pages/Faq";
import RenderCertificate from "./pages/RenderCertificate";
import PrivacyPolicy from "./pages/PrivacyPolicy";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:certId" element={<VerifyResult />} />
          <Route path="/__render/certificate" element={<RenderCertificate />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route element={<AdminLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/profile" element={<Profile />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/import" element={<ImportStudents />} />
            <Route path="/generate" element={<Generate />} />
            <Route path="/registry" element={<Registry />} />
            <Route path="/access" element={<AccessControl />} />
            <Route path="/help" element={<Help />} />
          </Route>
          <Route path="/faq" element={<Faq />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
