import { supabase } from "@/lib/supabaseClient";

const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Get bearer token from Supabase session
 */
async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Create Authorization header with JWT token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function getTemplates(): Promise<any[]> {
  const url = `${API_BASE}/templates`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch templates: ${res.status} ${txt}`);
  }
  return res.json();
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
