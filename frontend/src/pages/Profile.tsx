import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Clock3,
  FileText,
  KeyRound,
  Mail,
  MapPin,
  Save,
  Shield,
  UserCircle2,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { completeFirstLoginReset, sendPasswordResetEmail } from "@/lib/auth";

type ProfileForm = {
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  institutionName: string;
  institutionLogo: string;
  address: string;
  domain: string;
  role: "Admin" | "Super Admin";
  joined: string;
  organization: string;
};

const sectionLinks = [
  { id: "overview", label: "Profile Overview" },
  { id: "security", label: "Account Security" },
  { id: "organization", label: "Organization Details" },
  { id: "notifications", label: "Notification Preferences" },
  { id: "activity", label: "Activity Log" },
];

const activityLog = [
  { event: "Logged in", detail: "Web session from Chrome on Windows", time: "Today • 09:41 AM" },
  { event: "Created template", detail: "Academic Excellence 2026", time: "Yesterday • 04:22 PM" },
  { event: "Generated certificates", detail: "120 certificates in Batch #A-403", time: "Yesterday • 11:08 AM" },
  { event: "Invited admin", detail: "Added maria.garcia@institution.edu", time: "2 days ago • 02:40 PM" },
];

const initialProfile: ProfileForm = {
  fullName: "Dr. Sarah Chen",
  email: "sarah.chen@university.edu",
  phone: "+91 98765 43210",
  department: "Academic Affairs",
  designation: "Director of Certification",
  institutionName: "University of Technology",
  institutionLogo: "UT Seal",
  address: "Sector 11, Knowledge Park, Ahmedabad, Gujarat",
  domain: "university.edu",
  role: "Super Admin",
  joined: "Jan 2023",
  organization: "University of Technology",
};

const Profile = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [profile, setProfile] = useState<ProfileForm>(initialProfile);
  const [savedProfile, setSavedProfile] = useState<ProfileForm>(initialProfile);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);
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

  const completionScore = useMemo(() => {
    const fields = [profile.fullName, profile.phone, profile.department, profile.designation, profile.address, profile.domain];
    const filled = fields.filter((field) => field.trim().length > 0).length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const hasChanges = JSON.stringify(profile) !== JSON.stringify(savedProfile);
  const canEditOrg = profile.role === "Super Admin";

  const onFieldChange = (field: keyof ProfileForm, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const saveChanges = () => {
    setSavedProfile(profile);
    toast({
      title: "Profile updated successfully",
      description: "Your account information has been saved.",
    });
  };

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
                  <AvatarFallback className="bg-primary/10 text-primary text-4xl font-heading font-bold">SC</AvatarFallback>
                </Avatar>

                <div className="space-y-2 pb-2">
                  <h1 className="text-3xl font-heading font-bold text-foreground">{profile.fullName}</h1>
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
                    <p className="text-sm font-medium">{profile.organization}</p>
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
                      <p className="text-2xl font-heading font-bold text-foreground mt-1">24</p>
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
                      <p className="text-2xl font-heading font-bold text-foreground mt-1">1,280</p>
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
                      <p className="text-2xl font-heading font-bold text-foreground mt-1">6</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader className="border-b border-border/40 pb-4">
              <CardTitle className="text-lg font-heading flex items-center gap-2">
                <UserCircle2 className="w-5 h-5 text-accent" /> Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <Input
                    value={profile.fullName}
                    onChange={(e) => onFieldChange("fullName", e.target.value)}
                    className="h-11 bg-background/50 focus-visible:ring-offset-0 transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <Input value={profile.email} readOnly className="h-11 bg-muted/40 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <Input value={profile.phone} onChange={(e) => onFieldChange("phone", e.target.value)} className="h-11 bg-background/50 focus-visible:ring-offset-0 transition-all" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Department</label>
                  <Input value={profile.department} onChange={(e) => onFieldChange("department", e.target.value)} className="h-11 bg-background/50 focus-visible:ring-offset-0 transition-all" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Designation</label>
                  <Input value={profile.designation} onChange={(e) => onFieldChange("designation", e.target.value)} className="h-11 bg-background/50 focus-visible:ring-offset-0 transition-all" />
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button onClick={saveChanges} disabled={!hasChanges} className="gap-2 gold-gradient text-accent-foreground shadow-md transition-all hover:opacity-90">
                  <Save className="w-4 h-4" /> Save Changes
                </Button>
              </div>
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

              {/* TODO: Add 2FA & session tracking after backend auth integration */}
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
                      <Clock3 className="w-4 h-4 text-muted-foreground" /> Today, 09:41 AM
                    </p>
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">Primary Email</p>
                    <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                      <Mail className="w-4 h-4 text-muted-foreground" /> {profile.email}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card id="organization" className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Organization Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Institution Name</label>
                  <Input
                    value={profile.institutionName}
                    onChange={(e) => onFieldChange("institutionName", e.target.value)}
                    readOnly={!canEditOrg}
                    className={!canEditOrg ? "bg-muted/40" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Institution Logo</label>
                  <Input
                    value={profile.institutionLogo}
                    onChange={(e) => onFieldChange("institutionLogo", e.target.value)}
                    readOnly={!canEditOrg}
                    className={!canEditOrg ? "bg-muted/40" : ""}
                  />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium">Address</label>
                  <Input
                    value={profile.address}
                    onChange={(e) => onFieldChange("address", e.target.value)}
                    readOnly={!canEditOrg}
                    className={!canEditOrg ? "bg-muted/40" : ""}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Domain</label>
                  <Input
                    value={profile.domain}
                    onChange={(e) => onFieldChange("domain", e.target.value)}
                    readOnly={!canEditOrg}
                    className={!canEditOrg ? "bg-muted/40" : ""}
                  />
                </div>
              </div>

              {!canEditOrg && (
                <p className="text-xs text-muted-foreground">Only Super Admin can edit organization details.</p>
              )}
            </CardContent>
          </Card>

          <Card id="notifications" className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Email Alerts</p>
                  <p className="text-xs text-muted-foreground">Template updates and certificate generation summary.</p>
                </div>
                <Switch checked={emailAlerts} onCheckedChange={setEmailAlerts} />
              </div>
              <div className="rounded-md border border-border p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Security Alerts</p>
                  <p className="text-xs text-muted-foreground">Login attempts and account security notifications.</p>
                </div>
                <Switch checked={securityAlerts} onCheckedChange={setSecurityAlerts} />
              </div>
            </CardContent>
          </Card>

          <Card id="activity" className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Account Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityLog.map((entry) => (
                <div key={`${entry.event}-${entry.time}`} className="rounded-md border border-border p-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      <UserCircle2 className="w-4 h-4 text-muted-foreground" /> {entry.event}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>
                  </div>
                  <div className="text-xs text-muted-foreground shrink-0 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {entry.time}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
