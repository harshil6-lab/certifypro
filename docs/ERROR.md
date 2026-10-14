# ERROR.md — Defect Report: Silent empty `VITE_API_BASE_URL` breaks all backend calls in production builds

> Read-only finding. No source modified. Evidence paths verified 2026-10-14.

## 1. Summary

- **Severity:** High (production-breaking, silent).
- **Title:** Frontend `API_BASE` falls back to `""` when `VITE_API_BASE_URL` is unset, so every
  backend `fetch` becomes a same-origin relative URL and fails on Vercel (backend lives on Render).
- **Status:** Open — documented here, not fixed (read-only task).

## 2. Evidence (repository)

- `frontend/src/services/apiService.ts:4`:
  `const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/$/, "");`
  Every helper appends to it: `/api/templates` (`:41`), `/students` (`:84`),
  `/certificates` (`:95`), `/certificates/generate` (`:106`), `/verify/...` (`:131`).
- Same pattern duplicated: `frontend/src/pages/Contact.tsx:11`, `frontend/src/pages/ImportStudents.tsx:29`.
- Consumers assuming absolute base: `pages/Dashboard.tsx:58`, `pages/Generate.tsx:87,139,205,209,236`,
  `context/AccessControlContext.tsx:129`, `services/subscriptionService.ts:28-63`, `lib/auth.ts:7`.
- `README.md:171-176` and `Guide.md:§8` document only `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` —
  `VITE_API_BASE_URL` is **never documented** as required.
- `render.yaml:15,39-40` pins backend `FRONTEND_ORIGINS` and `API_BASE_URL` to Render/Vercel hosts,
  but there is no corresponding `VITE_API_BASE_URL` wiring shown for the Vercel frontend build,
  and `frontend/vercel.json` was not found to set it (only file present; no env block inspected).
- `frontend/vite.config.ts:11` sets `envDir: ".."`, so even a correctly created `frontend/.env`
  may be ignored if the variable is only defined there — compounding the misconfiguration risk.

## 3. Reproduction

1. Clone repo, `cd frontend && npm install`, do **not** set `VITE_API_BASE_URL` (follow `README`/`Guide` literally).
2. `npm run build && npm run preview` (or deploy to Vercel as documented).
3. Open DevTools Network tab; visit `/dashboard`, `/templates`, `/generate`, `/contact`.
4. Observe requests to `https://<vercel-host>/api/templates`, `.../dashboard/stats`,
   `.../api/contact` → 404 (Vercel has no such routes) instead of
   `https://certifypro-backend-lkkk.onrender.com/...`.
5. No fail-fast error: `API_BASE=""` yields `""/api/templates === "/api/templates"`, a valid
   relative URL, so the bug surfaces only as downstream 404/JSON-parse failures.

## 4. Impact

- All authenticated data flows break in any deployment where frontend ≠ backend origin:
  dashboard stats, templates, import preview/save, generation jobs, access-control, contact, subscription.
- Hard to diagnose: Supabase auth still succeeds (direct to Supabase), so login looks fine
  while every FastAPI call 404s.
- Per-page `API_BASE` duplicates mean a fix in `apiService.ts` alone leaves `Contact`/`ImportStudents` broken.

## 5. Recommended fix (not applied — advice only)

1. Centralize: export `API_BASE` only from `services/apiService.ts`; remove duplicates in
   `Contact.tsx`, `ImportStudents.tsx` (import it instead).
2. Fail fast + document:
   ```ts
   const raw = import.meta.env.VITE_API_BASE_URL;
   if (!raw) throw new Error("VITE_API_BASE_URL is not configured");
   const API_BASE = raw.replace(/\/$/, "");
   ```
   Add `VITE_API_BASE_URL` to `README` Quick Start, `Guide.md §8`, and provide
   `frontend/.env.example` (`VITE_API_BASE_URL=http://127.0.0.1:8000` local,
   Render URL in production).
3. Set `VITE_API_BASE_URL` in Vercel project env (production + preview) to the Render backend URL.
4. Clarify `vite.config.ts envDir: ".."` vs `frontend/.env` docs — pick one source of truth.
5. Optional guard: Vite `define` or startup self-check logging the resolved `API_BASE` (without secrets).

## 6. Real sources

- Vite env handling (`import.meta.env`, `envDir`): https://vite.dev/guide/env-and-mode
- Fetch URL resolution (empty base → same-origin relative URL): https://developer.mozilla.org/en-US/docs/Web/API/Request/url
  and https://developer.mozilla.org/en-US/docs/Web/API/fetch
- FastAPI CORS (`allow_origins` must match calling origin): https://fastapi.tiangolo.com/tutorial/cors/
- Supabase JS `createClient(url, anonKey)`: https://supabase.com/docs/reference/javascript/auth-signin
- Related secondary debt (not the reported defect, noted for triage):
  `@app.on_event("startup")` deprecation → use `lifespan`: https://fastapi.tiangolo.com/advanced/events/
  (`backend/app/main.py:94`); Render ephemeral disk: https://render.com/docs/disks#ephemeral-storage
  (generation output under `backend/uploads/generated/`, `main.py:86-91`).

## 7. Workaround until fixed

Set `VITE_API_BASE_URL=https://certifypro-backend-lkkk.onrender.com` (or your Render URL) in the
environment used for `npm run build` on Vercel, redeploy, and confirm Network tab shows
cross-origin calls to the Render host with CORS allowed (`render.yaml:15` +
`backend/app/main.py:57-64`).
