# FLOW.md — CertifyPro Runtime Flows

> Source: `frontend/src/App.tsx:43-64`, `backend/app/main.py:67-84`,
> `docs/understand_software.md:§4`, `docs/IMPLEMENTATION_DETAILS.md`,
> `frontend/src/lib/auth.ts`, `frontend/src/lib/accessRequest.ts`,
> `frontend/src/pages/Generate.tsx`, `frontend/src/pages/ImportStudents.tsx`.

## 1. Route map

Public: `/`, `/about`, `/features`, `/contact`, `/login`, `/verify`, `/verify/:certId`,
`/faq`, `/reset-password`, `/select-plan`.
Admin (under `<AdminLayout />`): `/dashboard`, `/dashboard/profile`, `/templates`,
`/import`, `/generate`, `/registry`, `/access`, `/help`. (`App.tsx:43-64`)

## 2. Backend endpoint index (prefixes from `main.py:67-84`)

- `/auth/*` (`auth_routes.py`) — login helper, `/me`, logout.
- `/user/*` (`user_routes.py`) — `GET /user/profile`, update, complete first-login; guarded by `AuthMiddleware`.
- `/dashboard/*` (`dashboard_routes.py` → `dashboard_service.py`) — `/dashboard/stats`, `/dashboard/activity`.
- `/students`, `/students/*` (`students_routes.py`) — CSV import + listing.
- `/certificates*` (`certificates_routes.py`, `certificates_service.py`) — legacy/admin generation + list.
- `/verify/{token}` + `/verify/*` (`verify.py` by `external_id`; `verify_routes.py` + `verify_service.py` by QR token).
- `/api/templates*` (`templates_routes.py` + `template_service.py` / `templates_service.py`) — list/create/upload/delete/layout.
- `/api/workspace-template` (`workspace_template.py`) — get/save active template + layout.
- `/api/generate/preview`, generation alternates (`generate_routes.py` + `generate_service.py`).
- `/api/import-students/save` (`import_students.py`) — Excel validate + insert.
- `/api/students-ready`, `/api/my-certificates` (`students_ready.py`) — generation queue + registry.
- `/api/generate-certificates/*`, `/api/jobs/{id}` (`generate_certificates.py`, `job_routes.py`) — **live bulk path**.
- `/api/access-control/*` (`access_control_routes.py`) — overview / invite / update / remove.
- `/api/contact` (`contact_routes.py` → `contact_service.py` SMTP).
- `/subscription/*` (`subscription_routes.py` → `subscription_service.py`, Razorpay).
- `/api/profile-activity` (`profile_activity.py`); static `/uploads/*` (`main.py:91`).

## 3. Flows

### F1. Access request → scoring → invite (async, via Edge Function)

1. `AdminAccessRequestModal.tsx` collects identity/org + proof doc.
2. `lib/accessRequest.ts` uploads doc to Storage (`org-documents`), inserts `access_requests` row.
3. Invokes `supabase/functions/process-access-request` with `{ request_id }`.
4. Function 6-step pipeline (`IMPLEMENTATION_DETAILS.md`): fetch → score
   (25/20/20/10/15/10) → status (`approved`/`hold`/`rejected`) → `inviteUserByEmail` if approved →
   status email via SMTP → update `score/status/approved_user_id/validation_notes`.
5. Frontend polls/reads final status; approved user completes `/reset-password?type=invite`.

### F2. Login → session → authorized call

1. `Login.tsx` → `auth.ts: signInWithEmailPassword` → Supabase Auth session in browser.
2. `initializeAuthSession` + `subscribeToAuthChanges` restore/refresh; email-verified check gates access.
3. `getAuthHeaders()` attaches `Authorization: Bearer <jwt>`; backend `auth_service.py`
   validates, routes scope by user id/email/org; `AuthMiddleware` enforces on
   `/user`, `/subscription`, `/api/generate`.

### F3. Profile / onboarding

`auth.ts` fetches `/user/profile` → `user_routes.py` → `profile_service.py`
(+ `ensure_actor_membership` bootstrap). Missing profile → bootstrap; completing profile
clears first-login flag. Writers must merge `app_users.metadata`, never overwrite.

### F4. Templates

`Templates.tsx` → `getTemplates()` → `GET /api/templates` → `templates` table.
Upload: multipart → `template_service.py` → Storage `certificate-templates` (must be public) →
row insert; PDF uploads optionally rasterized via `pdf2image` + Poppler.
Layout saved as JSON; active choice persisted via `/api/workspace-template`
(`layoutConfig.ts` normalizes).

### F5. Student import

`ImportStudents.tsx` uploads Excel → `POST /api/generate/preview`
(`generate_routes.py`: row verdicts valid/error/duplicate) → user reviews →
`POST /api/import-students/save` (`import_students.py` re-validates, `students_service.py`
adds org metadata, inserts into `students`). CSV path via `students_routes.py` is alternate.

### F6. Generation (live path)

`Generate.tsx` loads workspace template + `/api/students-ready` → user selects cohort →
`POST /api/generate-certificates/start|/all` (`generate_certificates.py`: fetch template image,
Pillow draw name/ID, qrcode QR with `PUBLIC_VERIFY_BASE_URL`, write
`backend/uploads/generated/`, insert `generated_certificates`, zip for bulk) →
poll `GET /api/jobs/{jobId}` → download via `/uploads/...` or registry.
Retention: `generated_certificate_retention_service.py` purges expired files.

### F7. Verification (two paths)

- ID path: `Verify.tsx` → `GET /verify/{external_id}` (`verify.py` → `students` lookup).
- QR path: QR scan → `/verify/:certId` (`VerifyResult.tsx`) → token lookup
  (`verify_routes.py` + `verify_service.py` → `certificates` table).
- `verifyCertificate()` helper: `apiService.ts:130-139`.

### F8. Dashboard / registry / contact

- Dashboard: `Dashboard.tsx` → `GET /dashboard/stats|/activity` → `dashboard_service.py`
  org-scoped counts + `activities` feed.
- Registry: `Registry.tsx` → `GET /api/my-certificates` (`students_ready.py`) → download list.
- Contact: `Contact.tsx` → `POST /api/contact` → `contact_service.py` SMTP to
  `CONTACT_DESTINATION_EMAIL` with `CONTACT_BRAND_NAME` branding.
