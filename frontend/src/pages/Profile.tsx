import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  CheckCircle,
  Clock3,
  FileText,
  KeyRound,
  Mail,
  Shield,
  UserCircle2,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { API_BASE, getAuthHeaders } from "@/services/apiService";
import {
  getMySubscription,
  selectFreePlan,
  createPaymentOrder,
  verifyPayment,
  openRazorpayCheckout,
  type SubscriptionInfo,
} from "@/services/subscriptionService";
import { supabase } from "@/lib/supabaseClient";
import {
  completeFirstLoginReset,
  getCurrentUserProfile,
  sendPasswordResetEmail,
  type UserProfile,
} from "@/lib/auth";

type ProfileForm = {
  fullName: string;
  email: string;
  role: "Staff" | "Admin" | "Super Admin";
  joined: string;
  lastLoginAt: string;
  organization: string;
};

type DashboardStats = {
  templates: number;
  certificates: number;
  admins: number;
};

type ActivityItem = {
  action?: string;
  meta?: Record<string, unknown> | null;
  created_at?: string | null;
};

type AccessControlOverview = {
  current_actor?: {
    name?: string;
    email?: string;
    member_type?: "super_admin" | "admin" | "co_admin";
    organization?: string;
  };
};

const sectionLinks = [
  { id: "overview", label: "Profile Overview" },
  { id: "subscription", label: "Subscription" },
  { id: "security", label: "Account Security" },
  { id: "activity", label: "Activity Log" },
];

const emptyProfile: ProfileForm = {
  fullName: "",
  email: "",
  role: "Admin",
  joined: "Unavailable",
  lastLoginAt: "",
  organization: "",
};

const emptyStats: DashboardStats = {
  templates: 0,
  certificates: 0,
  admins: 0,
};

const roleLabelMap: Record<UserProfile["role"], ProfileForm["role"]> = {
  staff: "Staff",
  admin: "Admin",
  super_admin: "Super Admin",
};

function formatJoinedDate(value?: string | null): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "Unavailable";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return date.toLocaleString();
}

function getAvatarInitials(profile: ProfileForm): string {
  const source = profile.fullName || profile.email || "User";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "U";
  }

  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

function mapMemberTypeToRole(memberType?: string): ProfileForm["role"] {
  if (memberType === "super_admin") {
    return "Super Admin";
  }
  if (memberType === "co_admin") {
    return "Staff";
  }
  return "Admin";
}

function mapProfileResponse(profile: UserProfile): ProfileForm {
  return {
    fullName: profile.full_name || "",
    email: profile.email || "",
    role: roleLabelMap[profile.role] || "Admin",
    joined: formatJoinedDate(profile.created_at),
    lastLoginAt: profile.last_login_at || "",
    organization: profile.organization || profile.institution_name || "",
  };
}

function mergeAccessFallback(current: ProfileForm, overview: AccessControlOverview | null): ProfileForm {
  const actor = overview?.current_actor;
  if (!actor) {
    return current;
  }

  const fallbackRole = mapMemberTypeToRole(actor.member_type);
  const shouldUseRoleFallback = current.role === "Admin" && Boolean(actor.member_type);

  return {
    ...current,
    fullName: current.fullName || actor.name || "",
    email: current.email || actor.email || "",
    organization: current.organization || actor.organization || "",
    role: shouldUseRoleFallback ? fallbackRole : current.role,
  };
}

function summarizeActivity(entry: ActivityItem): { event: string; detail: string; time: string } {
  const action = entry.action || "activity";
  const meta = entry.meta && typeof entry.meta === "object" ? entry.meta : {};

  if (action === "template_created") {
    const templateName = typeof meta.template_name === "string" ? meta.template_name : "Template created";
    return {
      event: "Created template",
      detail: templateName,
      time: formatDateTime(entry.created_at),
    };
  }

  if (action === "students_imported") {
    const importedCount = typeof meta.count === "number" ? meta.count : null;
    return {
      event: "Imported students",
      detail: importedCount ? `${importedCount} student records imported` : "Student records imported",
      time: formatDateTime(entry.created_at),
    };
  }

  if (action === "certificate_generated" || action === "certificate.created") {
    const certificateId = typeof meta.certificate_id === "string" ? meta.certificate_id : null;
    return {
      event: "Generated certificate",
      detail: certificateId ? `Certificate ID ${certificateId}` : "Certificate generation completed",
      time: formatDateTime(entry.created_at),
    };
  }

  return {
    event: "Account activity",
    detail: typeof meta.detail === "string" ? meta.detail : action.replace(/_/g, " "),
    time: formatDateTime(entry.created_at),
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileForm>(emptyProfile);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [activityLog, setActivityLog] = useState<Array<{ event: string; detail: string; time: string }>>([]);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const firstLoginMode = searchParams.get("firstLogin") === "1";

  useEffect(() => {
    const target = searchParams.get("section");
    if (!target) {
      return;
    }

    const element = document.getElementById(target);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [searchParams]);

  const loadSubscription = async () => {
    try {
      const sub = await getMySubscription();
      setSubscription(sub);
    } catch (error) {
      console.error("Failed to load subscription:", error);
      // Set a default subscription object to show the fallback UI
      setSubscription({
        plan: "free",
        plan_selected: false,
        credits_used: 0,
        credits_limit: 12,
        credits_remaining: 12,
      });
    }
  };

  useEffect(() => {
    void loadSubscription();
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadProfileData = async () => {
      setIsLoading(true);

      const [profileResult, statsResult, activityResult, accessResult] = await Promise.allSettled([
        getCurrentUserProfile(),
        (async () => {
          const headers = await getAuthHeaders();
          const response = await fetch(`${API_BASE}/dashboard/stats`, { headers });
          if (!response.ok) {
            throw new Error(`Failed to load stats: ${response.status}`);
          }
          return response.json() as Promise<DashboardStats>;
        })(),
        (async () => {
          const headers = await getAuthHeaders();
          const response = await fetch(`${API_BASE}/dashboard/activity`, { headers });
          if (!response.ok) {
            throw new Error(`Failed to load activity: ${response.status}`);
          }
          const data = await response.json();
          return Array.isArray(data.items) ? (data.items as ActivityItem[]) : [];
        })(),
        (async () => {
          const headers = await getAuthHeaders();
          const response = await fetch(`${API_BASE}/api/access-control/overview`, { headers });
          if (!response.ok) {
            return null;
          }
          return (await response.json()) as AccessControlOverview;
        })(),
      ]);

      if (!isMounted) {
        return;
      }

      const accessOverview = accessResult.status === "fulfilled" ? accessResult.value : null;

      if (profileResult.status === "fulfilled" && profileResult.value) {
        setProfile(mergeAccessFallback(mapProfileResponse(profileResult.value), accessOverview));
      } else {
        const fallbackOnly = mergeAccessFallback(emptyProfile, accessOverview);
        if (fallbackOnly.fullName || fallbackOnly.email) {
          setProfile(fallbackOnly);
        } else {
          toast({
            title: "Unable to load profile",
            description: "Profile details could not be fetched from the server.",
            variant: "destructive",
          });
        }
      }

      if (statsResult.status === "fulfilled") {
        setStats({
          templates: Number(statsResult.value.templates || 0),
          certificates: Number(statsResult.value.certificates || 0),
          admins: Number(statsResult.value.admins || 0),
        });
      }

      if (activityResult.status === "fulfilled") {
        setActivityLog(activityResult.value.map(summarizeActivity));
      }

      setIsLoading(false);
    };

    void loadProfileData();

    return () => {
      isMounted = false;
    };
  }, [toast]);

  const completionScore = useMemo(() => {
    const fields = [profile.fullName, profile.email, profile.organization];
    const filled = fields.filter((field) => field.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const handlePasswordReset = async () => {
    const result = await sendPasswordResetEmail(profile.email);

    if (!result.success) {
      toast({
        title: "Unable to send reset link",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Password reset email sent",
      description: "Check your inbox for reset instructions.",
    });
  };

  const handleFinishFirstLogin = async () => {
    const result = await completeFirstLoginReset();

    if (!result.success) {
      toast({
        title: "Unable to complete setup",
        description: result.error || "Please try again.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "First-login security completed",
      description: "Your account is now marked as active.",
    });
  };

  const getUserEmail = async (): Promise<string> => {
    const session = await supabase?.auth.getSession();
    return session?.data?.session?.user?.email ?? "";
  };

  const handleSelectFree = async () => {
    setIsUpgrading(true);
    try {
      await selectFreePlan();
      const sub = await getMySubscription();
      setSubscription(sub);
      toast({
        title: "Free plan selected",
        description: "You now have access to 12 free certificate generations.",
      });
    } catch {
      toast({
        title: "Unable to select free plan",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpgrading(false);
    }
  };

  const handleUpgradeToPro = async () => {
    setIsUpgrading(true);
    try {
      const orderData = await createPaymentOrder();
      const email = await getUserEmail();

      openRazorpayCheckout(
        orderData,
        email,
        async (paymentData) => {
          try {
            await verifyPayment(paymentData);
            const sub = await getMySubscription();
            setSubscription(sub);
            toast({
              title: "Upgraded to Pro!",
              description: "You now have unlimited certificate generations.",
            });
          } catch {
            toast({
              title: "Payment verification failed",
              description: "Please contact support.",
              variant: "destructive",
            });
          }
          setIsUpgrading(false);
        },
        (errMsg) => {
          toast({
            title: "Payment cancelled",
            description: errMsg,
            variant: "destructive",
          });
          setIsUpgrading(false);
        }
      );
    } catch {
      toast({
        title: "Unable to initiate payment",
        description: "Please try again.",
        variant: "destructive",
      });
      setIsUpgrading(false);
    }
  };

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <Card className="card-shadow lg:col-span-1 lg:sticky lg:top-24 h-fit transition-all duration-300">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="text-base font-heading font-semibold">Profile Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 pt-4">
            {sectionLinks.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-accent/10 hover:text-accent hover:pl-4 focus:bg-accent/10 focus:text-accent"
              >
                {item.label}
              </a>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-8 animate-fade-in">
          <Card id="overview" className="card-shadow overflow-hidden">
            <div className="h-32 bg-gradient-to-r from-primary/10 via-accent/5 to-background border-b border-border/50"></div>
            <CardContent className="p-6 relative">
              <div className="flex flex-col md:flex-row md:items-end gap-6 -mt-16 mb-6">
                <Avatar className="h-32 w-32 border-4 border-background shadow-xl">
                  <AvatarFallback className="bg-primary/10 text-primary text-4xl font-heading font-bold">{getAvatarInitials(profile)}</AvatarFallback>
                </Avatar>

                <div className="space-y-2 pb-2">
                  <h1 className="text-3xl font-heading font-bold text-foreground">{profile.fullName || "Unnamed User"}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={profile.role === "Super Admin" ? "gold-gradient text-accent-foreground shadow-sm" : "bg-secondary text-secondary-foreground"}>
                      {profile.role}
                    </Badge>
                    <Badge variant="outline" className="border-accent/40 text-muted-foreground bg-accent/5">Enterprise Account</Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Organization</p>
                    <p className="text-sm font-medium">{profile.organization || "Unavailable"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                  <CalendarDays className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member Since</p>
                    <p className="text-sm font-medium">{profile.joined}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Profile Completion</span>
                  <span className="font-bold text-accent">{completionScore}%</span>
                </div>
                <Progress value={completionScore} className="h-2" />
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="group border border-border/60 bg-card hover:border-accent/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Templates</p>
                      <p className="text-2xl font-heading font-bold text-foreground mt-1">{stats.templates}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <FileText className="w-5 h-5 text-accent" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="group border border-border/60 bg-card hover:border-accent/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Certificates</p>
                      <p className="text-2xl font-heading font-bold text-foreground mt-1">{stats.certificates}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Shield className="w-5 h-5 text-accent" />
                    </div>
                  </CardContent>
                </Card>
                <Card className="group border border-border/60 bg-card hover:border-accent/30 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Admins</p>
                      <p className="text-2xl font-heading font-bold text-foreground mt-1">{stats.admins}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card id="subscription" className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${subscription.plan === "pro" ? "gold-gradient" : "bg-accent/10"}`}>
                        {subscription.plan === "pro" ? (
                          <Zap className="w-5 h-5 text-accent-foreground" />
                        ) : (
                          <Shield className="w-5 h-5 text-accent" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold capitalize">{subscription.plan} Plan</p>
                        <p className="text-xs text-muted-foreground">
                          {subscription.plan === "pro"
                            ? "Unlimited certificate generations"
                            : `${subscription.credits_remaining || 0} generations remaining`}
                        </p>
                      </div>
                    </div>
                    <Badge className={subscription.plan === "pro" ? "gold-gradient text-accent-foreground" : "bg-secondary text-secondary-foreground"}>
                      {subscription.plan === "pro" ? "PRO" : "FREE"}
                    </Badge>
                  </div>

                  {subscription.plan === "free" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">Certificate Generations</span>
                        <span className="font-bold text-foreground">
                          {subscription.credits_used} / {subscription.credits_limit || 12}
                        </span>
                      </div>
                      <Progress value={(subscription.credits_used / (subscription.credits_limit || 12)) * 100} className="h-2" />

                      {!subscription.plan_selected ? (
                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" className="flex-1" onClick={handleSelectFree} disabled={isUpgrading}>
                            {isUpgrading ? "Processing..." : "Continue with Free"}
                          </Button>
                          <Button className="flex-1 gold-gradient text-accent-foreground" onClick={handleUpgradeToPro} disabled={isUpgrading}>
                            {isUpgrading ? "Processing..." : "Upgrade to Pro — ₹499/mo"}
                          </Button>
                        </div>
                      ) : (
                        <Button className="w-full gold-gradient text-accent-foreground" onClick={handleUpgradeToPro} disabled={isUpgrading}>
                          {isUpgrading ? "Processing..." : "Upgrade to Pro — ₹499/mo"}
                        </Button>
                      )}
                    </div>
                  )}

                  {subscription.plan === "pro" && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle className="w-4 h-4" />
                      <span>Your Pro subscription is active</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">Loading subscription information...</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => void loadSubscription()} disabled={isUpgrading}>
                      Retry
                    </Button>
                    <Button className="gold-gradient text-accent-foreground" onClick={() => navigate("/select-plan")}>
                      Select Plan
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="security" className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {firstLoginMode ? (
                <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  First login detected. Please reset your password before continuing.
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="gap-2" onClick={() => void handlePasswordReset()}>
                  <KeyRound className="w-4 h-4" /> Change Password
                </Button>
                {firstLoginMode ? (
                  <Button className="gap-2" onClick={() => void handleFinishFirstLogin()}>
                    <KeyRound className="w-4 h-4" /> I Have Reset My Password
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Last Login</p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                      <Clock3 className="w-4 h-4 text-muted-foreground" /> {formatDateTime(profile.lastLoginAt)}
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Primary Email</p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-muted-foreground" /> {profile.email || "Unavailable"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card id="activity" className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Account Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">Loading profile activity...</div>
              ) : activityLog.length > 0 ? (
                activityLog.map((entry) => (
                  <div key={`${entry.event}-${entry.time}`} className="rounded-md border border-border p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <UserCircle2 className="w-4 h-4 text-muted-foreground" /> {entry.event}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                      <Clock3 className="w-3.5 h-3.5" /> {entry.time}
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">
                  No activity has been recorded for this account yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
