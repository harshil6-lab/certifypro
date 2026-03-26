export type SessionActivityAction =
  | "template_uploaded"
  | "workspace_layout_saved"
  | "students_imported"
  | "certificates_generated"
  | "certificate_downloaded"
  | "certificate_verified";

export type SessionActivityItem = {
  id: string;
  action: SessionActivityAction;
  detail: string;
  meta?: Record<string, unknown>;
  created_at: string;
};

const STORAGE_KEY = "certifypro_session_activity";
const EVENT_NAME = "certifypro:session-activity-updated";
const MAX_ITEMS = 25;

const isBrowser = typeof window !== "undefined";

function readActivities(): SessionActivityItem[] {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    window.sessionStorage.removeItem(STORAGE_KEY);
    return [];
  }
}

function writeActivities(items: SessionActivityItem[]) {
  if (!isBrowser) {
    return;
  }

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
}

export function getSessionActivities(): SessionActivityItem[] {
  return readActivities();
}

export function addSessionActivity(
  action: SessionActivityAction,
  detail: string,
  meta?: Record<string, unknown>,
): SessionActivityItem {
  const item: SessionActivityItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    action,
    detail,
    meta,
    created_at: new Date().toISOString(),
  };

  const next = [item, ...readActivities()].slice(0, MAX_ITEMS);
  writeActivities(next);
  return item;
}

export function subscribeToSessionActivities(
  callback: (items: SessionActivityItem[]) => void,
): () => void {
  if (!isBrowser) {
    return () => undefined;
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<SessionActivityItem[]>;
    callback(Array.isArray(customEvent.detail) ? customEvent.detail : readActivities());
  };

  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}