import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_BASE, getAuthHeaders } from "@/services/apiService";


export type AccessPermission =
  | "dashboard"
  | "templates"
  | "import_students"
  | "generate"
  | "registry"
  | "access_control";

export type AccessMemberType = "super_admin" | "admin" | "co_admin";
export type AccessMemberStatus = "active" | "invited" | "removed";

export interface AccessMember {
  id: string;
  app_user_id?: string | null;
  auth_user_id?: string | null;
  name: string;
  email: string;
  member_type: AccessMemberType;
  status: AccessMemberStatus;
  permissions: AccessPermission[];
  organization?: string;
  organization_id?: string | null;
  organization_key?: string;
  joined_at?: string | null;
  invited_by_email?: string | null;
  is_current_user: boolean;
}

export interface PermissionCatalogItem {
  key: AccessPermission;
  label: string;
  description: string;
}

interface AccessOverview {
  current_actor: AccessMember;
  members: AccessMember[];
  permission_catalog: PermissionCatalogItem[];
  assignable_permissions: AccessPermission[];
  management_available?: boolean;
}

interface InviteResponse {
  member: AccessMember;
  email_sent?: boolean;
  email_status?: string;
  message?: string;
}

interface InvitePayload {
  email: string;
  memberType: "admin" | "co_admin";
  permissions: AccessPermission[];
}

interface AccessControlContextValue {
  ready: boolean;
  loading: boolean;
  error: string | null;
  degraded: boolean;
  managementAvailable: boolean;
  actor: AccessMember | null;
  members: AccessMember[];
  permissionCatalog: PermissionCatalogItem[];
  refresh: () => Promise<void>;
  inviteMember: (payload: InvitePayload) => Promise<string>;
  updatePermissions: (memberId: string, permissions: AccessPermission[]) => Promise<string>;
  removeMember: (memberId: string) => Promise<string>;
  hasPermission: (permission: AccessPermission) => boolean;
  canAccessPath: (pathname: string) => boolean;
}

const AccessControlContext = createContext<AccessControlContextValue | undefined>(undefined);

const FALLBACK_PERMISSION_CATALOG: PermissionCatalogItem[] = [
  { key: "dashboard", label: "Dashboard", description: "View operational overview and live status." },
  { key: "templates", label: "Templates", description: "Manage official and workspace templates." },
  { key: "import_students", label: "Import Students", description: "Import and validate student batches." },
  { key: "generate", label: "Generate", description: "Generate certificates in bulk." },
  { key: "registry", label: "Registry", description: "Review certificate registry and downloads." },
  { key: "access_control", label: "Access Control", description: "Manage admin and co-admin access." },
];

const FALLBACK_OVERVIEW: AccessOverview = {
  current_actor: {
    id: "fallback-admin",
    app_user_id: null,
    auth_user_id: null,
    name: "Admin",
    email: "",
    member_type: "admin",
    status: "active",
    permissions: ["dashboard", "templates", "import_students", "generate", "registry", "access_control"],
    joined_at: null,
    invited_by_email: null,
    is_current_user: true,
  },
  members: [],
  permission_catalog: FALLBACK_PERMISSION_CATALOG,
  assignable_permissions: ["dashboard", "templates", "import_students", "generate", "registry"],
  management_available: false,
};

const PATH_PERMISSION_MAP: Array<{ match: RegExp; permission: AccessPermission | null }> = [
  { match: /^\/dashboard\/profile(?:\?.*)?$/i, permission: null },
  { match: /^\/dashboard(?:\?.*)?$/i, permission: "dashboard" },
  { match: /^\/dashboard\/templates(?:\?.*)?$/i, permission: "templates" },
  { match: /^\/templates(?:\?.*)?$/i, permission: "templates" },
  { match: /^\/import(?:\?.*)?$/i, permission: "import_students" },
  { match: /^\/generate(?:\?.*)?$/i, permission: "generate" },
  { match: /^\/registry(?:\?.*)?$/i, permission: "registry" },
  { match: /^\/access(?:\?.*)?$/i, permission: "access_control" },
  { match: /^\/help(?:\?.*)?$/i, permission: null },
];

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers || {}),
    },
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text) as unknown;
    } catch {
      body = { message: text } as { message: string };
    }
  }
  if (!response.ok) {
    const detail =
      typeof body === "object" && body && "detail" in body && typeof (body as { detail?: unknown }).detail === "string"
        ? (body as { detail: string }).detail
        : null;
    const message =
      typeof body === "object" && body && "message" in body && typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : null;
    throw new Error(detail || message || `Request failed with status ${response.status}`);
  }
  return body as T;
}

export function AccessControlProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [degraded, setDegraded] = useState(false);
  const [overview, setOverview] = useState<AccessOverview | null>(null);

  const hasPermission = (permission: AccessPermission) => {
    const actor = overview?.current_actor;
    if (!actor) {
      return false;
    }
    if (actor.status !== "active") {
      return false;
    }
    if (actor.member_type === "super_admin" || actor.member_type === "admin") {
      return true;
    }
    return actor.permissions.includes(permission);
  };

  const canAccessPath = (pathname: string) => {
    const matched = PATH_PERMISSION_MAP.find((entry) => entry.match.test(pathname));
    if (!matched || matched.permission === null) {
      return true;
    }
    return hasPermission(matched.permission);
  };

  const refresh = async () => {
    setLoading(true);
    try {
      const nextOverview = await requestJson<AccessOverview>("/api/access-control/overview");
      setOverview(nextOverview);
      setError(null);
      setDegraded(nextOverview.management_available === false);
    } catch (nextError) {
      setOverview((current) => current ?? FALLBACK_OVERVIEW);
      setError(nextError instanceof Error ? nextError.message : "Unable to load access control state.");
      setDegraded(true);
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (!ready || loading || !overview) {
      return;
    }
    if (!canAccessPath(location.pathname)) {
      navigate("/dashboard", { replace: true });
    }
  }, [ready, loading, overview, location.pathname, navigate]);

const inviteMember = async (payload: InvitePayload) => {
  const actor = overview?.current_actor;

  let organizationId = actor?.organization_id ?? null;

  if (!organizationId) {
    try {
      const { createClient } = await import("@supabase/supabase-js");
      const client = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
      const { data: { session } } = await client.auth.getSession();
      organizationId =
        session?.user?.user_metadata?.organization_id ??
        session?.user?.app_metadata?.organization_id ??
        session?.user?.user_metadata?.organizationId ??
        session?.user?.app_metadata?.organizationId ??
        null;
    } catch {
      organizationId = null;
    }
  }

  const response = await requestJson<InviteResponse>("/api/access-control/invite", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email,
      member_type: payload.memberType,
      permissions: payload.permissions,
      organizationId,
    }),
  });
  await refresh();
  return response.message || `${response.member.name} is now ${response.member.status === "invited" ? "invited" : "active"}.`;
};

  const updatePermissions = async (memberId: string, permissions: AccessPermission[]) => {
    const response = await requestJson<{ member: AccessMember }>(`/api/access-control/members/${memberId}/permissions`, {
      method: "PATCH",
      body: JSON.stringify({ permissions }),
    });
    await refresh();
    return `Permissions updated for ${response.member.name}.`;
  };

  const removeMember = async (memberId: string) => {
    const response = await requestJson<{ member: AccessMember }>(`/api/access-control/members/${memberId}`, {
      method: "DELETE",
    });
    await refresh();
    return `${response.member.name} has been removed.`;
  };

  return (
    <AccessControlContext.Provider
      value={{
        ready,
        loading,
        error,
        degraded,
        managementAvailable: overview?.management_available ?? !degraded,
        actor: overview?.current_actor ?? null,
        members: overview?.members ?? [],
        permissionCatalog: overview?.permission_catalog ?? [],
        refresh,
        inviteMember,
        updatePermissions,
        removeMember,
        hasPermission,
        canAccessPath,
      }}
    >
      {children}
    </AccessControlContext.Provider>
  );
}

export function useAccessControl() {
  const context = useContext(AccessControlContext);
  if (!context) {
    throw new Error("useAccessControl must be used within AccessControlProvider");
  }
  return context;
}