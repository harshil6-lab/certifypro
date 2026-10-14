# DESIGN.md — CertifyPro System Design

> Source: `backend/app/main.py`, `backend/app/core/config.py`, `backend/app/core/supabase_client.py`,
> `frontend/src/App.tsx`, `frontend/src/services/apiService.ts`, `frontend/src/lib/supabaseClient.ts`,
> `frontend/vite.config.ts`, `frontend/tailwind.config.ts`, `render.yaml`, `requirements.txt`.

## 1. Architecture

```text
React 18 + Vite (frontend/)
  │  Supabase-JS auth/storage/functions  +  fetch/axios → FastAPI
  ▼                                        ▼
Supabase (Auth, Postgres, Storage,        FastAPI (backend/app/)
Edge Function process-access-request)      routers → services → Supabase (service-role)
                                           + local disk backend/uploads/generated/
```

- Frontend (`frontend/src/`): `pages/` (routes), `components/` (+ `ui/` shadcn/Radix primitives,
  `landing/`, `templates/`, `certificates/`), `context/AccessControlContext.tsx`,
  `lib/` (`auth.ts`, `supabaseClient.ts`, `accessRequest.ts`, `layoutConfig.ts`),
  `services/` (`apiService.ts`, `subscriptionService.ts`, `sessionActivity.ts`).
- Backend (`backend/app/`): `main.py` (app factory, CORS, router mount, `/uploads` static mount),
  `api/` (16 router modules), `services/` (15 service modules), `core/` (settings + Supabase client),
  `middleware/auth_middleware.py`, `dependencies/supabase_auth.py`.
- Data: Supabase Postgres tables `organizations`, `access_requests`, `app_users`,
  `templates`, `workspace_templates`, `students`, `certificates`, `generated_certificates`,
  `activities`, `profiles` (legacy/alternate). Files: Supabase Storage
  (`certificate-templates` public required, `org-documents`) + local `backend/uploads/generated/`.

## 2. Key design patterns

- **Thin routers, service layer**: `api/*.py` validate/extract identity; `services/*.py` own
  DB/storage/SMTP logic (e.g. `dashboard_routes.py` → `dashboard_service.py`,
  `access_control_routes.py` → `access_control_service.py`).
- **Bearer-token auth**: frontend `getAuthHeaders()` (`apiService.ts:19-28`) attaches Supabase JWT;
  backend validates via `services/auth_service.py`; `AuthMiddleware` guards
  `["/user", "/subscription", "/api/generate"]` (`main.py:52-56`), other routes validate inline.
- **Dual Supabase clients (frontend)**: `supabase` (persisted session) vs `publicSupabase`
  (no persistence) in `lib/supabaseClient.ts:38-57`; corrupted-JWT detection + storage-key
  cleanup in `lib/supabaseClient.ts:36,59-116`.
- **Central API base with silent fallback**: `API_BASE = (VITE_API_BASE_URL ?? "").replace(...)`
  (`apiService.ts:4`; duplicated in `Contact.tsx:11`, `ImportStudents.tsx:29`). See `ERROR.md`.
- **Layout-config-driven rendering**: template + JSON layout (`layoutConfig.ts`) tells Pillow
  where to draw name / ID / QR (`templates_routes.py`, `template_service.py`, `generate_certificates.py`).
- **Static uploads mount**: `main.py:86-91` creates/serves `backend/uploads` at `/uploads`.

## 3. Frontend design

- Routing: `BrowserRouter` + `QueryClientProvider` + `TooltipProvider` (`App.tsx:37-69`);
  public routes flat, admin routes nested under `<AdminLayout />` (permission gate).
- UI system: Tailwind + shadcn/ui over Radix primitives (`components/ui/*`, `components.json`);
  icons `lucide-react`, forms `react-hook-form + zod + @hookform/resolvers`,
  charts `recharts`, animation `framer-motion`, 3D landing (`@react-three/fiber/drei + three`).
- Config quirks: `vite.config.ts:11` sets `envDir: ".."` (env loaded from repo root, not
  `frontend/`); dev server `port: 8080` (`vite.config.ts:14`) while `README`/`Guide` document
  `http://localhost:5173` — flag before changing ports.

## 4. Backend design

- App title `CertifyPro Backend` (`main.py:36`); CORS origins from `FRONTEND_ORIGINS` env
  plus hardcoded `https://certifypro-tau.vercel.app` and `/https:\/\/.*\.vercel\.app/` regex
  (`main.py:43-64`); credentials allowed, all methods/headers allowed.
- Router prefixes: `/auth`, `/user`, `/dashboard`, `/students`, `/certificates`, templates/verify/
  /generate/import/jobs/workspace/profile-access-control/contact/subscription mounted mostly
  under `/api/*` (see `FLOW.md` §3 for exact list).
- Startup seeds gallery templates (`main.py:94-103` calls `seed_default_templates()` +
  `seed_gallery_templates()`); uses deprecated `@app.on_event("startup")` — see `ERROR.md`.
- Settings: plain `Settings` class reading env via `python-dotenv`, loading
  `backend/.env` then process env (`core/config.py:9-10`); intentionally avoids
  pydantic `BaseSettings` (`config.py:14-19`).

## 5. Deployment design

- Backend → Render (`render.yaml`: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`,
  Python 3.11, Supabase/SMTP/Razorpay envs `sync: false`).
- Frontend → Vercel (`frontend/vercel.json`); `render.yaml:15,39-40` pins
  `FRONTEND_ORIGINS=https://certifypro-tau.vercel.app` and
  `API_BASE_URL=https://certifypro-backend-lkkk.onrender.com`.
- Risk: generated files on Render local disk are ephemeral; Supabase Storage is durable
  but generation output currently targets local disk (`main.py:87`, `understand_software.md:§10.4`).
