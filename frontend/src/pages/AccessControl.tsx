import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Crown,
  Mail,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { PageContainer, PageToolbar } from "@/components/layout/PageContainer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type DataColumn } from "@/components/DataTable";
import { EmptyState } from "@/components/States";
import { useToast } from "@/components/ui/use-toast";
import {
  useAccessControl,
  type AccessMember,
  type AccessPermission,
} from "@/context/AccessControlContext";

function formatJoined(value?: string | null) {
  if (!value) {
    return "Not signed in yet";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Pending";
  }
  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

function roleLabel(member: AccessMember) {
  if (member.member_type === "super_admin") {
    return "Super Admin";
  }
  if (member.member_type === "co_admin") {
    return "Co-Admin";
  }
  return "Admin";
}

const AccessControl = () => {
  const { toast } = useToast();
  const {
    actor,
    members,
    permissionCatalog,
    loading,
    error,
    degraded,
    managementAvailable,
    inviteMember,
    updatePermissions,
    removeMember,
    refresh,
  } = useAccessControl();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "co_admin">("co_admin");
  const [invitePermissions, setInvitePermissions] = useState<AccessPermission[]>(["dashboard", "registry"]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [memberPermissions, setMemberPermissions] = useState<AccessPermission[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const selectedMember = members.find((member) => member.id === selectedMemberId) || null;
  const canManageAdmins = actor?.member_type === "super_admin";
  const canManageCoAdmins = actor?.member_type === "super_admin" || actor?.member_type === "admin";

  useEffect(() => {
    if (selectedMember?.member_type === "co_admin") {
      setMemberPermissions(selectedMember.permissions);
      return;
    }
    setMemberPermissions([]);
  }, [selectedMember?.id, selectedMember?.member_type, selectedMember?.permissions]);

  useEffect(() => {
    if (inviteRole === "admin" && !canManageAdmins) {
      setInviteRole("co_admin");
    }
  }, [inviteRole, canManageAdmins]);

  const toggleInvitePermission = (permission: AccessPermission) => {
    setInvitePermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const toggleMemberPermission = (permission: AccessPermission) => {
    setMemberPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  };

  const handleInvite = async () => {
    setSubmitting(true);
    try {
      const message = await inviteMember({
        email: inviteEmail,
        memberType: inviteRole,
        permissions: inviteRole === "admin" ? [] : invitePermissions,
      });
      toast({ title: "Access updated", description: message });
      setInviteEmail("");
      setInviteRole("co_admin");
      setInvitePermissions(["dashboard", "registry"]);
    } catch (nextError) {
      toast({
        title: "Invite failed",
        description: nextError instanceof Error ? nextError.message : "Unable to invite member.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePermissionSave = async () => {
    if (!selectedMember) {
      return;
    }
    setSubmitting(true);
    try {
      const message = await updatePermissions(selectedMember.id, memberPermissions);
      toast({ title: "Permissions saved", description: message });
    } catch (nextError) {
      toast({
        title: "Save failed",
        description: nextError instanceof Error ? nextError.message : "Unable to update permissions.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    setSubmitting(true);
    try {
      const message = await removeMember(memberId);
      toast({ title: "Member removed", description: message });
      if (selectedMemberId === memberId) {
        setSelectedMemberId(null);
      }
    } catch (nextError) {
      toast({
        title: "Remove failed",
        description: nextError instanceof Error ? nextError.message : "Unable to remove member.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const memberColumns: DataColumn<AccessMember>[] = [
    {
      key: "name",
      header: "Administrator",
      accessor: (member) => member.name,
      sortable: true,
      render: (member) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
              {getInitials(member.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{member.name}</p>
            <p className="text-xs text-muted-foreground">{member.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      accessor: (member) => roleLabel(member),
      sortable: true,
      render: (member) =>
        member.member_type === "super_admin" ? (
          <Badge className="gap-1">
            <Crown className="h-3 w-3" aria-hidden="true" /> Super Admin
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1">
            <ShieldCheck className="h-3 w-3" aria-hidden="true" /> {roleLabel(member)}
          </Badge>
        ),
    },
    {
      key: "status",
      header: "Status",
      accessor: (member) => member.status,
      sortable: true,
      render: (member) => (
        <Badge variant={member.status === "active" ? "success" : "neutral"}>{member.status}</Badge>
      ),
    },
    {
      key: "joined",
      header: "Joined",
      accessor: (member) => member.joined_at,
      sortable: true,
      render: (member) => (
        <span className="text-sm text-muted-foreground">{formatJoined(member.joined_at)}</span>
      ),
    },
    {
      key: "permissions",
      header: "Permissions",
      accessor: (member) =>
        member.member_type === "admin" || member.member_type === "super_admin"
          ? "All modules"
          : member.permissions
              .map((permission) => permissionCatalog.find((item) => item.key === permission)?.label || permission)
              .join(", "),
      render: (member) => (
        <div className="flex flex-wrap gap-2">
          {(member.member_type === "admin" || member.member_type === "super_admin"
            ? ["All modules"]
            : member.permissions.map((permission) => permissionCatalog.find((item) => item.key === permission)?.label || permission)
          ).map((permission) => (
            <Badge key={`${member.id}-${permission}`} variant="secondary" className="text-xs">
              {permission}
            </Badge>
          ))}
        </div>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (member) => {
        const removable = member.member_type === "co_admin" ? canManageCoAdmins : canManageAdmins;
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedMemberId(member.id)}
              disabled={member.member_type !== "co_admin" || loading || degraded || !managementAvailable}
            >
              Manage
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              aria-label={`Remove ${member.name || member.email}`}
              onClick={() => void handleRemove(member.id)}
              disabled={!removable || member.is_current_user || loading || submitting || degraded || !managementAvailable}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer className="space-y-6 animate-fade-in">
      <PageToolbar
        crumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Access control" }]}
        title="Access control"
        description="Manage super admin, admin, and co-admin access."
        actions={
          <Badge variant="outline" className="px-3 py-1 text-sm">
            Your role: {actor ? roleLabel(actor) : "Loading…"}
          </Badge>
        }
      />

      <Alert>
        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
        <AlertTitle>Reserved super admin</AlertTitle>
        <AlertDescription>
          A reserved super-admin account retains permanent access and cannot be modified or removed from this panel.
        </AlertDescription>
      </Alert>

      {error ? (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Access control load failed</AlertTitle>
          <AlertDescription>
            {error}
            {degraded ? " The rest of the admin panel is still available, but access management needs the backend API to respond." : ""}
          </AlertDescription>
        </Alert>
      ) : null}

      {degraded ? (
        <Alert className="border-warning/40 [&>svg]:text-warning">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Read-only fallback mode</AlertTitle>
          <AlertDescription>
            Role visibility is available, but invite, update, and remove actions stay disabled until the backend responds again.
          </AlertDescription>
        </Alert>
      ) : null}

      {degraded ? (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => void refresh()} disabled={loading || submitting}>
            Retry
          </Button>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <UserPlus className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Invite administrator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-[1fr_220px]">
              <div>
                <Label className="mb-2 block text-sm font-medium">Invite by email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="colleague@institution.edu"
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label className="mb-2 block text-sm font-medium">Role</Label>
                <Select
                  value={inviteRole}
                  onValueChange={(value: "admin" | "co_admin") => setInviteRole(value)}
                  disabled={!canManageCoAdmins}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {canManageAdmins ? <SelectItem value="admin">Admin</SelectItem> : null}
                    <SelectItem value="co_admin">Co-Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Component permissions</p>
                  <p className="text-xs text-muted-foreground">Required for co-admins. Admins automatically get full access.</p>
                </div>
                {inviteRole === "admin" ? <Badge>Full access</Badge> : <Badge variant="outline">Custom access</Badge>}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {permissionCatalog
                  .filter((permission) => permission.key !== "access_control")
                  .map((permission) => (
                    <label
                      key={permission.key}
                      htmlFor={`invite-permission-${permission.key}`}
                      className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-3 cursor-pointer"
                    >
                      <Checkbox
                        id={`invite-permission-${permission.key}`}
                        checked={inviteRole === "admin" || invitePermissions.includes(permission.key)}
                        onCheckedChange={() => toggleInvitePermission(permission.key)}
                        disabled={inviteRole === "admin"}
                      />
                      <div>
                        <p className="text-sm font-medium text-foreground">{permission.label}</p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </label>
                  ))}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => void handleInvite()}
                disabled={submitting || !inviteEmail.trim() || !canManageCoAdmins || degraded || !managementAvailable}
                className="gap-2"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {inviteRole === "admin" ? "Invite admin" : "Invite co-admin"}
              </Button>
            </div>

            {degraded || !managementAvailable ? (
              <p className="text-right text-xs text-muted-foreground">
                Invite actions will unlock automatically once access control responds again.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              Selected member permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedMember ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-foreground">{selectedMember.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedMember.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{roleLabel(selectedMember)}</Badge>
                  <Badge variant={selectedMember.status === "active" ? "success" : "neutral"}>{selectedMember.status}</Badge>
                </div>
                <div className="space-y-3">
                  {permissionCatalog
                    .filter((permission) => permission.key !== "access_control")
                    .map((permission) => (
                      <label key={permission.key} htmlFor={`member-permission-${permission.key}`} className="flex items-start gap-3 rounded-lg border border-border p-3 cursor-pointer">
                        <Checkbox
                          id={`member-permission-${permission.key}`}
                          checked={selectedMember.member_type !== "co_admin" || memberPermissions.includes(permission.key)}
                          onCheckedChange={() => toggleMemberPermission(permission.key)}
                          disabled={selectedMember.member_type !== "co_admin" || !canManageCoAdmins}
                        />
                        <div>
                          <p className="text-sm font-medium text-foreground">{permission.label}</p>
                          <p className="text-xs text-muted-foreground">{permission.description}</p>
                        </div>
                      </label>
                    ))}
                </div>
                <Button
                  onClick={() => void handlePermissionSave()}
                  disabled={submitting || selectedMember.member_type !== "co_admin" || !canManageCoAdmins || degraded || !managementAvailable}
                  className="w-full"
                >
                  Save permissions
                </Button>
              </>
            ) : (
              <EmptyState title="No member selected" description="Select a co-admin from the table to edit granular component access." />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            Approved administrators and co-admins ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable<AccessMember>
            columns={memberColumns}
            rows={members}
            rowKey={(member) => member.id}
            searchPlaceholder="Search by name or email…"
            getSearchText={(member) => `${member.name} ${member.email} ${roleLabel(member)}`}
            emptyTitle="No members found"
            emptyDescription="Invite an administrator or adjust your search."
            caption="Approved administrators and co-admins"
          />
        </CardContent>
      </Card>
    </PageContainer>
  );
};

export default AccessControl;
