import { getSessionSafely, supabase } from "@/lib/supabaseClient";

const API_BASE = "http://127.0.0.1:8000";
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

export async function getTemplates(options?: { official?: boolean; category?: string }): Promise<any[]> {
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

  const data = await res.json();
  if (Array.isArray(data)) {
    console.log("Templates loaded:", data.length);
  }
  return data;
}

export async function getStudents(): Promise<any[]> {
  const url = `${API_BASE}/students`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch students: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function getCertificates(): Promise<any[]> {
  const url = `${API_BASE}/certificates`;
  const headers = await getAuthHeaders();
  const res = await fetch(url, { method: "GET", headers });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch certificates: ${res.status} ${txt}`);
  }
  return res.json();
}

export async function generateCertificate(template_id: string, student_id: string): Promise<any> {
  const url = `${API_BASE}/certificates/generate`;
  const headers = await getAuthHeaders();
  const body = JSON.stringify({ template_id, student_id });
  const res = await fetch(url, { method: "POST", headers, body });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to generate certificate: ${res.status} ${txt}`);
  }
  return res.json();
}

// Future API helpers (auth, user) can be added here.

export async function verifyCertificate(token: string): Promise<any> {
  const url = `${API_BASE}/verify/${encodeURIComponent(token)}`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    if (res.status === 404) throw new Error("Certificate not found");
    const txt = await res.text();
    throw new Error(`Verification failed: ${res.status} ${txt}`);
  }
  return res.json();
}
