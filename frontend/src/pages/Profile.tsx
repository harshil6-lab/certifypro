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
  Phone,
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

const activeSessions = [
  { device: "Chrome • Windows", location: "Ahmedabad, IN", status: "Current session" },
  { device: "Safari • iPad", location: "Ahmedabad, IN", status: "Last active 3h ago" },
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
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [securityAlerts, setSecurityAlerts] = useState(true);

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

  return (
    <div className="p-8 max-w-[1240px] mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <Card className="card-shadow lg:col-span-1 lg:sticky lg:top-24">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-heading">Profile Menu</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sectionLinks.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block rounded-md border border-border px-3 py-2 text-sm text-foreground hover:bg-muted/60 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-6">
          <Card id="overview" className="card-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-5">
                <Avatar className="h-24 w-24 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">SC</AvatarFallback>
                </Avatar>

                <div className="space-y-2">
                  <h1 className="text-2xl font-heading font-bold text-foreground">{profile.fullName}</h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={profile.role === "Super Admin" ? "gold-gradient text-accent-foreground" : ""}>
                      {profile.role}
                    </Badge>
                    <Badge variant="outline">Enterprise Account</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> {profile.organization}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <CalendarDays className="w-4 h-4" /> Joined: {profile.joined}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Profile Completion</span>
                  <span className="font-medium text-foreground">{completionScore}%</span>
                </div>
                <Progress value={completionScore} />
              </div>

              <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Card className="border border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Templates Created</p>
                      <p className="text-xl font-heading font-bold">24</p>
                    </div>
                    <FileText className="w-5 h-5 text-accent" />
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Certificates Issued</p>
                      <p className="text-xl font-heading font-bold">1,280</p>
                    </div>
                    <Shield className="w-5 h-5 text-accent" />
                  </CardContent>
                </Card>
                <Card className="border border-border">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Active Admins</p>
                      <p className="text-xl font-heading font-bold">6</p>
                    </div>
                    <Users className="w-5 h-5 text-accent" />
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Full Name</label>
                  <Input value={profile.fullName} onChange={(e) => onFieldChange("fullName", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Email</label>
                  <Input value={profile.email} readOnly className="bg-muted/40" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Phone</label>
                  <Input value={profile.phone} onChange={(e) => onFieldChange("phone", e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Department</label>
                  <Input value={profile.department} onChange={(e) => onFieldChange("department", e.target.value)} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium">Designation</label>
                  <Input value={profile.designation} onChange={(e) => onFieldChange("designation", e.target.value)} />
                </div>
              </div>

              <Button onClick={saveChanges} disabled={!hasChanges} className="gap-2">
                <Save className="w-4 h-4" /> Save Changes
              </Button>
            </CardContent>
          </Card>

          <Card id="security" className="card-shadow">
            <CardHeader>
              <CardTitle className="text-lg font-heading">Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" className="gap-2">
                  <KeyRound className="w-4 h-4" /> Change Password
                </Button>
                <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
                  <span className="text-sm">2FA (UI only)</span>
                </div>
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

              <div className="space-y-2">
                <p className="text-sm font-medium">Active Sessions</p>
                {activeSessions.map((session) => (
                  <div key={session.device} className="rounded-md border border-border p-3 text-sm flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{session.device}</p>
                      <p className="text-muted-foreground text-xs">{session.location}</p>
                    </div>
                    <Badge variant="outline">{session.status}</Badge>
                  </div>
                ))}
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
