# AGENTS.md — CertifyPro Agent Working Agreement

> Read-only reconnaissance basis: `README.md`, `Guide.md`, `docs/understand_software.md`,
> `docs/IMPLEMENTATION_DETAILS.md`, `backend/app/main.py`, `backend/app/core/config.py`,
> `frontend/src/App.tsx`, `frontend/src/services/apiService.ts`,
> `frontend/vite.config.ts`, `render.yaml`, `.gitignore`, `requirements.txt`.

## 1. Scope constraint (active)

- This task is **read-only**: inspect code and write documentation under `docs/`.
- Do **not** modify application source (`backend/`, `frontend/src/`, `supabase/`, `database/`).
- Do **not** create/edit `.env` files, install packages, or run servers.
- Only files this task may create: `docs/AGENTS.md`, `docs/PRODUCT.md`,
  `docs/DESIGN.md`, `docs/DECISION.md`, `docs/FLOW.md`, `docs/ERROR.md`.

## 2. Project identity

CertifyPro is a certificate issuance / verification platform:

- `frontend/` — React 18 + Vite + TypeScript + Tailwind + shadcn/ui, Supabase browser auth.
- `backend/` — FastAPI (`backend/app/main.py`), Supabase Python SDK, Pillow + qrcode, pandas/openpyxl.
- Platform — Supabase Auth / Postgres / Storage / Edge Function
  (`supabase/functions/process-access-request/index.ts`).

## 3. How to investigate (cheap, evidence-first)

1. Start: `README.md` → `Guide.md` → `docs/understand_software.md` → `frontend/src/App.tsx` → `backend/app/main.py`.
2. Feature lookup table is in `docs/understand_software.md` §9 — trust it, then verify the cited file.
3. Duplicate/legacy paths exist — always confirm which route the frontend actually calls:
   - `verify.py` (by `external_id`) vs `verify_routes.py` (by QR token).
   - `generate_certificates.py` (used by `Generate.tsx`) vs `generate_routes.py` / `generate_service.py` (alternate path).
   - `profile_service.py` (live) vs `user_service.py` (placeholder).
   - `import_students.py` (Excel, live) vs `students_routes.py` (CSV path).
4. `app_users.metadata` is load-bearing: profile + onboarding + access-control state share one JSON column. Never propose overwrite; always merge.
5. Use `read` for files, `grep` for symbols, `glob` for file lists. Prefer one larger read over many slices.

## 4. Commands (do not run unless user explicitly lifts read-only constraint)

```powershell
cd frontend; npm install; npm run dev      # Vite, see vite.config.ts (port 8080, envDir "..")
.\.venv\Scripts\Activate.ps1; uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
cd frontend; npm run build; npm run lint; npm run test
```

Backend entry: `uvicorn backend.app.main:app`. Frontend routes: `frontend/src/App.tsx:43-64`.
Backend routers: `backend/app/main.py:67-84`. Settings loader: `backend/app/core/config.py:7-38`.

## 5. Env / secrets handling

- Never print secret values. Reference names only.
- Frontend needs `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, plus `VITE_API_BASE_URL`
  (see `frontend/src/services/apiService.ts:4` — empty-string fallback is a known defect, see `docs/ERROR.md`).
- Backend needs `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (fail-fast if missing),
  `FRONTEND_ORIGINS`, SMTP vars, `API_BASE_URL`, `PUBLIC_VERIFY_BASE_URL`.
- Service-role key is backend-only; never put it in `frontend/.env`.
- `.gitignore:17-20,101-108` ignores all `.env` variants; `/backend/.env` and `/frontend/.env` are git-ignored by design.

## 6. Definition of done for doc tasks

- Every factual claim traceable to a file:line (e.g. `backend/app/main.py:36`, `frontend/src/App.tsx:52`).
- If evidence contradicts `README.md`/`Guide.md` (e.g. Vite port 8080 vs documented 5173), state the discrepancy explicitly.
- Keep docs concise, no emojis unless asked, no superlatives.
