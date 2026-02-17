import { useState, useEffect } from "react";
import {
  Award,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  QrCode,
  Upload,
  Printer,
  Search,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ProfileOnboardingModal } from "@/components/ProfileOnboardingModal";
import { useAdminOnboarding, type OnboardingProfile } from "@/hooks/useAdminOnboarding";

const stats = [
  { label: "Certificates Issued", value: "0", icon: Award, change: "+0 this month" },
  { label: "Pending Tasks", value: "0", icon: Clock, change: "0 urgent" },
  { label: "Recent Verifications", value: "0", icon: CheckCircle2, change: "Last 7 days" },
  { label: "Active Templates", value: "0", icon: FileText, change: "0 drafts" },
];

const workflowSteps = [
  { step: 1, title: "Upload Template", desc: "Design your certificate template", icon: Upload, link: "/templates", done: true },
  { step: 2, title: "Import Students", desc: "Upload student data via Excel", icon: Users, link: "/import", done: true },
  { step: 3, title: "Generate Certificates", desc: "Batch generate with QR codes", icon: Printer, link: "/generate", done: false },
  { step: 4, title: "Verify & Distribute", desc: "Public verification portal", icon: Search, link: "/registry", done: false },
];

const recentActivity = [
  { action: "Certificate batch generated", count: "250 certificates", time: "2 hours ago", type: "generate" },
  { action: "Template updated", count: "B.Sc. Computer Science", time: "5 hours ago", type: "template" },
  { action: "Student data imported", count: "180 records", time: "1 day ago", type: "import" },
  { action: "Verification request", count: "CERT-2024-0892", time: "1 day ago", type: "verify" },
];

const Dashboard = () => {
  const { isCompleted, isLoading, completeOnboarding, skipOnboarding } = useAdminOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Once hook finishes loading, show onboarding if not completed
  useEffect(() => {
    console.log(`[Dashboard] isLoading: ${isLoading}, isCompleted: ${isCompleted}`);
    if (!isLoading && !isCompleted) {
      console.log("[Dashboard] Showing onboarding modal");
      setShowOnboarding(true);
    }
  }, [isLoading, isCompleted]);

  const handleOnboardingComplete = (data: Omit<OnboardingProfile, "completedAt">) => {
    completeOnboarding(data);
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    skipOnboarding();
    setShowOnboarding(false);
  };

  return (
    <>
      <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">
              Welcome back, Admin
            </h1>
            <p className="text-muted-foreground mt-1">
              Here's what's happening with your certificates today.
            </p>
          </div>
          <Link to="/help">
            <Button variant="outline" size="sm" className="gap-2">
              <HelpCircle className="w-4 h-4" />
              User Manual
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="card-shadow hover:card-shadow-lg transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-heading font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-success" />
                      {stat.change}
                    </p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <stat.icon className="w-5 h-5 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow Tracker */}
        <Card className="card-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading">Certificate Workflow</CardTitle>
            <p className="text-sm text-muted-foreground">Follow these steps to issue certificates</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {workflowSteps.map((step, i) => (
                <Link to={step.link} key={step.step}>
                  <div className={`relative p-4 rounded-lg border-2 transition-all hover:card-shadow group ${
                    step.done ? "border-success/30 bg-success/5" : "border-border hover:border-accent/50"
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        step.done ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
                      }`}>
                        {step.done ? <CheckCircle2 className="w-4 h-4" /> : step.step}
                      </div>
                      <step.icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium text-sm text-foreground">{step.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{step.desc}</p>
                    {i < workflowSteps.length - 1 && (
                      <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 z-10" />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="card-shadow">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-heading">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.action}</p>
                      <p className="text-xs text-muted-foreground">{item.count}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{item.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onboarding Modal */}
      <ProfileOnboardingModal
        isOpen={showOnboarding}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </>
  );
};

export default Dashboard;
