import { useState, useEffect } from "react";
import {
  Award,
  FileText,
  Users,
  CheckCircle2,
  ArrowRight,
  Upload,
  Printer,
  Search,
  HelpCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/layout/PageContainer";
import { ProfileOnboardingModal } from "@/components/ProfileOnboardingModal";
import { useAdminOnboarding, type OnboardingProfile } from "@/hooks/useAdminOnboarding";
import { API_BASE, getAuthHeaders } from "@/services/apiService";
import {
  getSessionActivities,
  subscribeToSessionActivities,
  type SessionActivityItem,
} from "@/services/sessionActivity";

const Dashboard = () => {
  const { isCompleted, isLoading, completeOnboarding, skipOnboarding } = useAdminOnboarding();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [stats, setStats] = useState({
    certificates: 0,
    templates: 0,
    students: 0,
    admins: 0
  });
  const [recentActivity, setRecentActivity] = useState<SessionActivityItem[]>([]);

  const hasActivity = (action: SessionActivityItem["action"]) =>
    recentActivity.some((item) => item.action === action);

  const workflowSteps = [
    { step: 1, title: "Upload Template", desc: "Design your certificate template", icon: Upload, link: "/templates", done: stats.templates > 0 || hasActivity("template_uploaded") || hasActivity("workspace_layout_saved") },
    { step: 2, title: "Import Students", desc: "Upload student data via Excel", icon: Users, link: "/import", done: stats.students > 0 || hasActivity("students_imported") },
    { step: 3, title: "Generate Certificates", desc: "Batch generate with QR codes", icon: Printer, link: "/generate", done: stats.certificates > 0 || hasActivity("certificates_generated") },
    { step: 4, title: "Verify & Distribute", desc: "Public verification portal", icon: Search, link: "/registry", done: hasActivity("certificate_verified") || hasActivity("certificate_downloaded") },
  ];

  useEffect(() => {
    if (!isLoading && !isCompleted) {
      setShowOnboarding(true);
    }
  }, [isLoading, isCompleted]);

  useEffect(() => {
    // Fetch dashboard stats
    const fetchStats = async () => {
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/dashboard/stats`, { headers });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        } else {
          console.error("Failed to fetch dashboard stats:", res.status, await res.text());
        }
      } catch (err) {
        console.error("Failed to fetch stats:", err);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    setRecentActivity(getSessionActivities());
    return subscribeToSessionActivities(setRecentActivity);
  }, []);

  const handleOnboardingComplete = (data: Omit<OnboardingProfile, "completedAt">) => {
    completeOnboarding(data);
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    skipOnboarding();
    setShowOnboarding(false);
  };

  const statsData = [
    { label: "Certificates Issued", value: stats.certificates, icon: Award, note: stats.certificates > 0 ? "Total issued" : "No certificates yet" },
    { label: "Active Templates", value: stats.templates, icon: FileText, note: stats.templates > 0 ? "In your workspace" : "No template yet" },
    { label: "Total Students", value: stats.students, icon: Users, note: stats.students > 0 ? "Imported records" : "No students yet" },
    { label: "System Admins", value: stats.admins, icon: CheckCircle2, note: "With platform access" },
  ];

  return (
    <>
      <PageContainer className="space-y-8 animate-fade-in">
        <PageHeader
          title="Welcome back"
          description="Overview of your certificate issuance and verification activity."
          actions={
            <Link to="/help">
              <Button variant="outline" className="gap-2">
                <HelpCircle className="h-4 w-4" />
                User guide
              </Button>
            </Link>
          }
        />

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsData.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.note}</p>
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Workflow Tracker */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Certificate workflow</CardTitle>
            <p className="text-sm text-muted-foreground">Four steps to issue a new batch of certificates.</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {workflowSteps.map((step, i) => (
                <Link
                  to={step.link}
                  key={step.step}
                  className={`group relative block h-full rounded-lg border p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    step.done
                      ? "border-success/40 bg-success/5 hover:border-success/60"
                      : "border-border hover:border-accent/40 hover:bg-muted"
                  }`}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        step.done ? "bg-success text-success-foreground" : "bg-secondary text-secondary-foreground"
                      }`}>
                        {step.done ? <CheckCircle2 className="h-4 w-4" /> : step.step}
                      </div>
                      <step.icon className={`h-5 w-5 transition-colors ${step.done ? "text-success" : "text-muted-foreground group-hover:text-accent"}`} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">{step.title}</h3>
                      <p className="text-xs leading-snug text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>

                  {i < workflowSteps.length - 1 && (
                    <div className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-border bg-background p-1 md:block">
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/60" />
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-1">
                {recentActivity.map((item, i) => {
                  // Parse activity based on action type
                  let activityText = "";
                  if (item.action === "template_uploaded") {
                    activityText = `Template uploaded → ${item.detail}`;
                  } else if (item.action === "workspace_layout_saved") {
                    activityText = `Workspace updated → ${item.detail}`;
                  } else if (item.action === "students_imported") {
                    activityText = `Students imported → ${item.detail}`;
                  } else if (item.action === "certificates_generated") {
                    activityText = `Certificates generated → ${item.detail}`;
                  } else if (item.action === "certificate_downloaded") {
                    activityText = `Certificate downloaded → ${item.detail}`;
                  } else if (item.action === "certificate_verified") {
                    activityText = `Verification opened → ${item.detail}`;
                  } else {
                    activityText = item.detail || "Activity";
                  }

                  return (
                    <div key={i} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                        <p className="truncate text-sm text-foreground">{activityText}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.created_at ? new Date(item.created_at).toLocaleString() : "Recently"}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="text-sm font-medium text-foreground">No recent activity yet</p>
                <p className="mt-1 text-xs text-muted-foreground">Your latest actions will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </PageContainer>

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
