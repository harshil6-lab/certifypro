# PRODUCT.md — CertifyPro Product Definition

> Source: `README.md:81-111`, `Guide.md`, `docs/understand_software.md:§1,§4`, `frontend/src/App.tsx`, `frontend/src/pages/`.

## 1. What it is

CertifyPro is a full-stack certificate automation and verification platform for
institutions and training orgs. It covers the end-to-end flow: org onboarding →
template management → student import → QR-backed generation → public verification,
plus dashboard, registry, access control, profiles, and contact/support.

## 2. Users

| User | Goal | Entry points |
| --- | --- | --- |
| Public visitor | Learn, contact, verify a certificate | `/`, `/about`, `/features`, `/contact`, `/verify`, `/verify/:certId` |
| Access requester (no account) | Request admin access with org proof document | `Login.tsx` → `AdminAccessRequestModal.tsx` |
| Admin / super_admin | Configure workspace, import, generate, review registry | `/dashboard`, `/templates`, `/import`, `/generate`, `/registry`, `/access` |
| Co-admin | Scoped admin work (permissions-gated) | Same admin shell, gated by `AccessControlContext` + `AdminLayout` |
| Verifier (anyone) | Confirm certificate authenticity | `/verify`, `VerifyResult.tsx`, `PublicCertificateVerificationModal.tsx` |

## 3. Feature map (route → capability)

| Route | File | Capability |
| --- | --- | --- |
| `/` | `pages/Index.tsx` | Landing |
| `/login`, `/reset-password` | `pages/Login.tsx`, `pages/ResetPassword.tsx` | Supabase email/password auth, invite + reset flows |
| `/dashboard`, `/dashboard/profile` | `pages/Dashboard.tsx`, `pages/Profile.tsx` | Metrics (`/dashboard/stats`), activity, onboarding, security |
| `/templates` | `pages/Templates.tsx`, `pages/DashboardTemplates.tsx` | Official gallery + custom upload, layout config, workspace selection |
| `/import` | `pages/ImportStudents.tsx` | Excel preview (`/api/generate/preview`) → save (`/api/import-students/save`) |
| `/generate` | `pages/Generate.tsx` | Bulk generation (`/api/generate-certificates/*`), job polling (`/api/jobs/{id}`) |
| `/registry` | `pages/Registry.tsx` | Generated-certificate registry (`/api/my-certificates`) |
| `/access` | `pages/AccessControl.tsx` | Invite / permission update / remove (`/api/access-control/*`) |
| `/verify`, `/verify/:certId` | `pages/Verify.tsx`, `pages/VerifyResult.tsx` | Public ID- and QR-token verification |
| `/contact`, `/help`, `/faq`, `/about` | corresponding pages | SMTP contact flow, help content |

Admin shell: `frontend/src/App.tsx:52-61` wraps all admin routes in `<AdminLayout />`.

## 4. Non-goals / status

- No explicit production license (`README.md:310-312` — confirm before commercial distribution).
- Environment-dependent: fresh machine needs Supabase project, SQL runs, `certificate-templates`
  public bucket, `.env` recreation, `npm install` + `pip install -r requirements.txt`
  (`README.md:302-304`, `Guide.md:§18`).
- PDF template preview is optional (needs `pdf2image` + Poppler).
- Edge Function `process-access-request` is optional; without it, scoring/invite emails don't run.

## 5. Success criteria

- Requester can go request → approved/hold/rejected with audit `validation_notes`.
- Admin can go template → import → generate → registry download without manual DB edits.
- Public verifier gets a definitive valid/invalid answer from either ID or QR token.
- Dashboard counts match underlying `templates` / `students` / `generated_certificates` tables
  for the caller's org scope.
