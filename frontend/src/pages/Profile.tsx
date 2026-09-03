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
import { PageContainer } from "@/components/layout/PageContainer";
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
  joined: "—",
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
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
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

if (action === "signed_in") {
    const device = typeof meta.device === "string" ? meta.device : "Unknown device";
    const ip = typeof meta.ip === "string" ? meta.ip : "";
    return {
      event: "Signed in",
      detail: `${device}${ip ? " · " + ip : ""}`,
      time: formatDateTime(entry.created_at),
    };
  }

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
          const response = await fetch(`${API_BASE}/profile/login-activity`, { headers });
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
    <PageContainer className="animate-fade-in">
      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-4">
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Sections</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {sectionLinks.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </a>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-3">
          <Card id="overview">
            <CardContent className="p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <Avatar className="h-20 w-20 border border-border">
                  <AvatarFallback className="bg-muted text-xl font-semibold text-foreground">{getAvatarInitials(profile)}</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{profile.fullName || "Unnamed user"}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={profile.role === "Super Admin" ? "default" : "secondary"}>{profile.role}</Badge>
                    {profile.email ? <span className="text-sm text-muted-foreground">{profile.email}</span> : null}
                  </div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Organization</p>
                    <p className="text-sm font-medium text-foreground">{profile.organization || "—"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Member since</p>
                    <p className="text-sm font-medium text-foreground">{profile.joined}</p>
                  </div>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Profile completion</span>
                  <span className="font-semibold text-foreground">{completionScore}%</span>
                </div>
                <Progress value={completionScore} className="h-2" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Templates</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stats.templates}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <FileText className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Certificates</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stats.certificates}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Shield className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Admins</p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{stats.admins}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                      <Users className="h-5 w-5" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card id="subscription">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Subscription</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription ? (
                <>
                  <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
                        {subscription.plan === "pro" ? (
                          <Zap className="h-5 w-5" />
                        ) : (
                          <Shield className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold capitalize text-foreground">{subscription.plan} plan</p>
                        <p className="text-xs text-muted-foreground">
                          {subscription.plan === "pro"
                            ? "Unlimited certificate generations"
                            : `${subscription.credits_remaining || 0} generations remaining`}
                        </p>
                      </div>
                    </div>
                    <Badge variant={subscription.plan === "pro" ? "default" : "secondary"}>
                      {subscription.plan === "pro" ? "PRO" : "FREE"}
                    </Badge>
                  </div>

                  {subscription.plan === "free" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-muted-foreground">Certificate generations</span>
                        <span className="font-semibold text-foreground">
                          {subscription.credits_used} / {subscription.credits_limit || 12}
                        </span>
                      </div>
                      <Progress value={(subscription.credits_used / (subscription.credits_limit || 12)) * 100} className="h-2" />

                      {!subscription.plan_selected ? (
                        <div className="flex gap-3 pt-2">
                          <Button variant="outline" className="flex-1" onClick={handleSelectFree} disabled={isUpgrading}>
                            {isUpgrading ? "Processing…" : "Continue with Free"}
                          </Button>
                          <Button variant="accent" className="flex-1" onClick={handleUpgradeToPro} disabled={isUpgrading}>
                            {isUpgrading ? "Processing…" : "Upgrade to Pro — ₹499/mo"}
                          </Button>
                        </div>
                      ) : (
                        <Button variant="accent" className="w-full" onClick={handleUpgradeToPro} disabled={isUpgrading}>
                          {isUpgrading ? "Processing…" : "Upgrade to Pro — ₹499/mo"}
                        </Button>
                      )}
                    </div>
                  )}

                  {subscription.plan === "pro" && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span>Your Pro subscription is active.</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
                    <Shield className="h-6 w-6" />
                  </div>
                  <p className="mb-4 text-sm text-muted-foreground">Loading subscription information…</p>
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={() => void loadSubscription()} disabled={isUpgrading}>
                      Retry
                    </Button>
                    <Button onClick={() => navigate("/select-plan")}>
                      Select plan
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card id="security">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {firstLoginMode ? (
                <div className="rounded-md border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                  First login detected. Please reset your password before continuing.
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="gap-2" onClick={() => void handlePasswordReset()}>
                  <KeyRound className="h-4 w-4" /> Change password
                </Button>
                {firstLoginMode ? (
                  <Button className="gap-2" onClick={() => void handleFinishFirstLogin()}>
                    <KeyRound className="h-4 w-4" /> I've reset my password
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Last login</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Clock3 className="h-4 w-4 text-muted-foreground" /> {formatDateTime(profile.lastLoginAt)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Primary email</p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Mail className="h-4 w-4 text-muted-foreground" /> {profile.email || "—"}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card id="activity">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Account activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="rounded-md border border-border p-4 text-sm text-muted-foreground">Loading profile activity…</div>
              ) : activityLog.length > 0 ? (
                activityLog.map((entry) => (
                  <div key={`${entry.event}-${entry.time}`} className="flex items-start justify-between gap-3 rounded-md border border-border p-3">
                    <div>
                      <p className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                        <UserCircle2 className="h-4 w-4 text-muted-foreground" /> {entry.event}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{entry.detail}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" /> {entry.time}
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
    </PageContainer>
  );
};

export default Profile;
