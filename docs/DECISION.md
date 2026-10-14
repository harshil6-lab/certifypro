# DECISION.md — CertifyPro Architectural Decisions

> Source: code + `docs/understand_software.md:§10`, `docs/IMPLEMENTATION_DETAILS.md`,
> `backend/app/main.py`, `backend/app/core/config.py`, `frontend/vite.config.ts`.

| # | Decision | Context | Alternatives considered | Consequence |
| --- | --- | --- | --- | --- |
| D1 | Supabase as Auth + Postgres + Storage + Functions | Needed managed identity/DB/files without owning infra; `supabase-js` (frontend) + `supabase` Python SDK (backend) | Self-hosted Postgres / Firebase / custom JWT | Fast onboarding, but two identity stores (`auth.users` + `app_users`) must be kept in sync; RLS + service-role discipline required |
| D2 | FastAPI thin-router + service-layer split (`api/` → `services/`) | 16 routers / 15 services; keeps generation, access-control, verify logic testable | Monolithic route handlers | Clear ownership, but overlapping legacy paths accumulated (see D6) |
| D3 | `app_users.metadata` JSONB as profile + onboarding + access-control store | One flexible column avoids migrations for new flags | Normalized `profiles` table (exists in `database/profiles_schema.sql` but not live path) | Flexible, but overwrite = data loss; all writers must merge (see `understand_software.md:§10.6`) |
| D4 | Plain `Settings` class + `python-dotenv` instead of pydantic `BaseSettings` | Stated: "simpler local runs and tests" (`core/config.py:14-19`) | pydantic settings with validation | Fewer deps, but no type-level validation; missing keys surface at runtime (fail-fast only for Supabase keys) |
| D5 | Local-disk generation output (`backend/uploads/generated/`) + `/uploads` static mount | Simple for local dev; Pillow writes PNGs + zips directly (`main.py:86-91`) | Supabase Storage for all outputs | Works locally, ephemeral on Render; needs retention service (`generated_certificate_retention_service.py`) |
| D6 | Keep duplicate verification/generation paths (`verify.py` vs `verify_routes.py`; `generate_certificates.py` vs `generate_routes.py`/`generate_service.py`) | Incremental delivery; human-friendly ID lookup + stronger QR-token check both wanted | Consolidate to one verify + one generate pipeline | Supports both UX flows today, but maintainer must confirm live path (`Generate.tsx` → `generate_certificates.py`) before editing |
| D7 | Edge Function scores access requests (corporate domain +25, org-match +20, doc +20, LinkedIn +10, format +15, OCR placeholder +10) with 6-step logged pipeline | Needed gated onboarding with audit trail (`IMPLEMENTATION_DETAILS.md`) | Manual admin review only | Auditable auto-triage (`approved/hold/rejected` + `validation_notes`), but scoring weights are heuristic, not ML |
| D8 | CORS allowlist = `FRONTEND_ORIGINS` env + hardcoded Vercel prod + `*.vercel.app` regex, credentials on | Preview deploys must call backend without redeploy | Strict single-origin | Convenient previews, wider surface; must tighten if abuse observed |
| D9 | `vite.config.ts envDir: ".."` + dev port `8080` | Share root `.env` with backend loading | Per-package `.env` + default port 5173 | Root env sharing works, but contradicts `README`/`Guide` (5173 + `frontend/.env`); onboarding confusion |
| D10 | SMTP via stdlib `smtplib` + `email.message` (contact + edge-function mail) | No extra mail dep | Resend/SendGrid API | Zero new deps, but delivery/retry/observability is caller's job |

## Open / revisit

- Consolidate verify + generate pipelines; remove or explicitly mark legacy modules.
- Move generation output to Supabase Storage (or object store) for durable production downloads.
- Replace `@app.on_event("startup")` with `lifespan` handler (deprecated API — see `ERROR.md`).
- Centralize `API_BASE` (remove per-page duplicates) and fail fast when `VITE_API_BASE_URL` is unset.
