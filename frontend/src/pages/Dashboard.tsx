import { useState, useEffect } from "react";
import {
  Award,
  FileText,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Upload,
  Printer,
  Search,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const { isCompleted, isLoading, profile, completeOnboarding, skipOnboarding } = useAdminOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading && !isCompleted) {
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-heading font-bold text-foreground">
              Welcome back, Admin
            </h1>
            <p className="text-lg text-muted-foreground/90">
              Overview of your certificate issuance and verification tasks.
            </p>
            {profile?.organization ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-sm font-medium text-accent">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                {profile.organization}
              </span>
            ) : null}
          </div>
          <Link to="/help">
            <Button size="lg" className="gap-2 shadow-sm text-base h-11 px-6 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300">
              <HelpCircle className="w-5 h-5" />
              View User Guide
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat) => (
            <Card key={stat.label} className="card-shadow hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-accent/40 cursor-default bg-card/60 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-base font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-heading font-bold text-foreground tracking-tight">{stat.value}</p>
                    <p className="text-sm font-medium text-muted-foreground/80 flex items-center gap-1.5 bg-muted/50 w-fit px-2 py-0.5 rounded-md">
                      <TrendingUp className="w-3.5 h-3.5 text-success" />
                      {stat.change}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center transition-colors group-hover:bg-accent/20">
                    <stat.icon className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow Tracker */}
        <Card className="card-shadow border-t-4 border-t-accent">
          <CardHeader className="pb-6 border-b border-border/40">
            <div className="flex items-center gap-2">
              <div className="h-8 w-1 bg-accent rounded-full" />
              <div>
                <CardTitle className="text-xl font-heading font-bold">Certificate Workflow</CardTitle>
                <p className="text-base text-muted-foreground mt-1">Follow these 4 steps to issue new certificates</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {workflowSteps.map((step, i) => (
                <Link to={step.link} key={step.step} className="block h-full">
                  <div className={`relative h-full p-5 rounded-xl border-2 transition-all duration-300 group hover:-translate-y-1 hover:shadow-md ${step.done ? "border-success/40 bg-success/5 hover:border-success/60" : "border-border hover:border-accent/60 hover:bg-accent/5"
                    }`}>
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${step.done ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"
                          }`}>
                          {step.done ? <CheckCircle2 className="w-5 h-5" /> : step.step}
                        </div>
                        <step.icon className={`w-6 h-6 ${step.done ? "text-success" : "text-muted-foreground group-hover:text-accent"} transition-colors`} />
                      </div>

                      <div className="space-y-1">
                        <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">{step.title}</h3>
                        <p className="text-sm text-muted-foreground leading-snug">{step.desc}</p>
                      </div>
                    </div>

                    {i < workflowSteps.length - 1 && (
                      <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 bg-background rounded-full p-1 border border-border">
                        <ArrowRight className="w-4 h-4 text-muted-foreground/60" />
                      </div>
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
                <div key={i} className="flex items-center justify-between py-3 border-b last:border-0 rounded-lg px-2 transition-colors hover:bg-accent/5 cursor-default">
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
