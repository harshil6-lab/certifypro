const API_BASE = (import.meta as any).env.VITE_API_BASE_URL || "http://localhost:8000";

export async function getTemplates(): Promise<any[]> {
  const url = `${API_BASE}/templates`;
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Failed to fetch templates: ${res.status} ${txt}`);
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
