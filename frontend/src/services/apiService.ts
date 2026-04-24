import { getSessionSafely, supabase } from "@/lib/supabaseClient";
import type { CertificateStyleType, CertificateTemplateMeta } from "@/components/certificates/types";

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");
export { API_BASE };

/**
 * Get bearer token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;
  const session = await getSessionSafely();
  return session?.access_token ?? null;
}

/**
 * Create Authorization header with JWT token
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function getTemplates(options?: { official?: boolean; category?: string }): Promise<CertificateTemplateMeta[]> {
  const params = new URLSearchParams();
  if (options?.official) {
    params.set("official", "true");
  }
  if (options?.category) {
    params.set("category", options.category);
  }

  const queryString = params.toString();
  // Note: backend routes for templates are mounted at /api/templates
  const url = `${API_BASE}/api/templates${queryString ? `?${queryString}` : ""}`;

  console.log("Fetching templates from backend", url);

  const res = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch templates: ${res.status} ${txt}`);
  }

  const data = (await res.json()) as unknown;
  const items = Array.isArray(data) ? (data as Array<Record<string, unknown>>) : [];
  if (Array.isArray(items)) {
    console.log("Templates loaded:", items.length);
  }

  return items.map((item): CertificateTemplateMeta => {
    const id = typeof item.id === "string" ? item.id : "";
    const title = typeof item.title === "string" ? item.title : "Template";
    const category = typeof item.category === "string" ? item.category : "Academic";
    const editable_fields = item.editable_fields ?? item.editableFields ?? [];
    const editableFields = Array.isArray(editable_fields) ? editable_fields.filter((x) => typeof x === "string") : [];
    const styleType = (item.style_type ?? item.styleType ?? "academicFormal") as CertificateStyleType;

    return {
      id,
      title,
      // backend stores category as text; ensure it aligns with GalleryCategory values used in UI
      category: category as CertificateTemplateMeta["category"],
      styleType,
      editableFields,
      file_url: typeof item.file_url === "string" ? item.file_url : undefined,
      image_url: typeof item.image_url === "string" ? item.image_url : undefined,
      preview_url: typeof item.preview_url === "string" ? item.preview_url : undefined,
      layout_config: (typeof item.layout_config === "object" && item.layout_config) ? (item.layout_config as CertificateTemplateMeta["layout_config"]) : undefined,
    };
  });
}

export async function getStudents(): Promise<Array<Record<string, unknown>>> {
  const url = `${API_BASE}/students`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch students: ${res.status} ${txt}`);
  }
  return (await res.json()) as Array<Record<string, unknown>>;
}

export async function getCertificates(): Promise<Array<Record<string, unknown>>> {
  const url = `${API_BASE}/certificates`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch certificates: ${res.status} ${txt}`);
  }
  return (await res.json()) as Array<Record<string, unknown>>;
}

export async function generateCertificate(template_id: string, student_id: string): Promise<Record<string, unknown>> {
  const url = `${API_BASE}/certificates/generate`;
  const headers = await getAuthHeaders();
  const body = JSON.stringify({ template_id, student_id });
  const res = await fetch(url, { method: "POST", headers, body });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to generate certificate: ${res.status} ${txt}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

// Future API helpers (auth, user) can be added here.

export async function verifyCertificate(token: string): Promise<Record<string, unknown>> {
  const url = `${API_BASE}/verify/${encodeURIComponent(token)}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Certificate not found");
    const txt = await res.text();
    throw new Error(`Verification failed: ${res.status} ${txt}`);
  }
  return (await res.json()) as Record<string, unknown>;
}
