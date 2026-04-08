# CertifyPro Setup Guide

This guide is for someone who downloaded this project as a ZIP from GitHub and wants to run it locally.

Because ZIP downloads do not include ignored files, you will be missing some important local-only items such as:

- `.env` files
- `.venv` Python virtual environment
- `node_modules`
- generated upload folders
- Supabase project secrets
- local database/storage configuration

This document explains everything step by step.

---

## 1. What This Project Uses

CertifyPro is built with these main parts:

- Frontend: React + Vite + TypeScript + Tailwind CSS
- Backend: FastAPI + Python
- Database/Auth/Storage: Supabase
- Optional serverless flow: Supabase Edge Function for access request processing

---

## 2. Prerequisites

Install these on your system first:

### Required

1. Node.js 20.x or later
2. npm 10.x or later
3. Python 3.11 or later
4. A Supabase account and a Supabase project

### Recommended

1. Git
2. VS Code
3. Supabase CLI
4. Bun (optional, only if you prefer `bun install` over `npm install`)

### Optional for PDF template previews

1. `pdf2image` Python package
2. Poppler installed on your system and added to `PATH`

If you do not install `pdf2image` and Poppler, the main app can still run, but PDF-to-image preview generation for uploaded templates may fail.

---

## 3. Extract the ZIP

Unzip the repository anywhere on your machine.

Example path:

```powershell
D:\CertifyPro
```

In this guide, that folder is called the project root.

---

## 4. Frontend Dependencies

Open a terminal in the project root, then move into the frontend folder:

```powershell
cd frontend
npm install
```

If you prefer Bun:

```powershell
cd frontend
bun install
```

### Frontend runtime libraries used by this project

- `@hookform/resolvers`
- `@radix-ui/react-accordion`
- `@radix-ui/react-alert-dialog`
- `@radix-ui/react-aspect-ratio`
- `@radix-ui/react-avatar`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-dialog`
- `@radix-ui/react-dropdown-menu`
- `@radix-ui/react-hover-card`
- `@radix-ui/react-label`
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-progress`
- `@radix-ui/react-radio-group`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-select`
- `@radix-ui/react-separator`
- `@radix-ui/react-slider`
- `@radix-ui/react-slot`
- `@radix-ui/react-switch`
- `@radix-ui/react-tabs`
- `@radix-ui/react-toast`
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-tooltip`
- `@react-three/drei`
- `@react-three/fiber`
- `@supabase/supabase-js`
- `@tanstack/react-query`
- `axios`
- `class-variance-authority`
- `clsx`
- `cmdk`
- `date-fns`
- `embla-carousel-react`
- `framer-motion`
- `input-otp`
- `lucide-react`
- `next-themes`
- `react`
- `react-day-picker`
- `react-dom`
- `react-hook-form`
- `react-resizable-panels`
- `react-router-dom`
- `recharts`
- `sonner`
- `tailwind-merge`
- `tailwindcss-animate`
- `three`
- `vaul`
- `zod`

### Frontend development libraries used by this project

- `@eslint/js`
- `@tailwindcss/typography`
- `@testing-library/jest-dom`
- `@testing-library/react`
- `@types/node`
- `@types/react`
- `@types/react-dom`
- `@vitejs/plugin-react-swc`
- `autoprefixer`
- `eslint`
- `eslint-plugin-react-hooks`
- `eslint-plugin-react-refresh`
- `globals`
- `jsdom`
- `lovable-tagger`
- `postcss`
- `tailwindcss`
- `typescript`
- `typescript-eslint`
- `vite`
- `vitest`

---

## 5. Backend Dependencies

Go back to the project root and create a Python virtual environment:

```powershell
cd ..
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
```

Install the backend packages:

```powershell
pip install fastapi uvicorn python-dotenv supabase requests httpx qrcode[pil] pillow pandas openpyxl python-multipart email-validator pydantic
```

### Optional backend packages

Install this only if you want PDF template preview generation:

```powershell
pip install pdf2image
```

### Backend libraries used by this project

- `fastapi`
- `uvicorn`
- `python-dotenv`
- `supabase`
- `requests`
- `httpx`
- `qrcode[pil]`
- `pillow`
- `pandas`
- `openpyxl`
- `python-multipart`
- `email-validator`
- `pydantic`
- `pdf2image` optional

### Why some of these are needed

- `fastapi`: backend API framework
- `uvicorn`: ASGI server used to run FastAPI
- `python-dotenv`: loads `.env` values
- `supabase`: database, auth, storage access
- `requests` and `httpx`: HTTP requests to Supabase and assets
- `qrcode[pil]`: QR generation for certificate verification
- `pillow`: image editing for certificates
- `pandas` and `openpyxl`: Excel import support
- `python-multipart`: required for file upload endpoints
- `email-validator`: required because the backend uses `EmailStr`
- `pdf2image`: optional PDF preview support

---

## 6. Missing Environment Files You Must Create

This repository does not include real `.env` files. You must create them yourself.

Create these files manually:

1. `backend/.env`
2. `frontend/.env`

Optional:

3. root `.env`

The backend code explicitly tries to load `backend/.env`. If you also keep a root `.env`, it can help when running commands from the repository root.

---

## 7. Backend Environment Variables

Create `backend/.env` with the following content:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
FRONTEND_ORIGINS=http://localhost:5173
ACCESS_INVITE_REDIRECT_URL=http://localhost:5173/reset-password?type=invite
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=no-reply@yourdomain.com
CONTACT_DESTINATION_EMAIL=certifyprocare@gmail.com
CONTACT_BRAND_NAME=ElevateX
API_BASE_URL=http://127.0.0.1:8000
PUBLIC_VERIFY_BASE_URL=http://localhost:5173/verify
```

### What each backend variable does

- `SUPABASE_URL`: your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: server-side key used by FastAPI
- `FRONTEND_ORIGINS`: allowed frontend origin for CORS
- `ACCESS_INVITE_REDIRECT_URL`: redirect used in admin invite flows
- `SMTP_HOST`: mail server host
- `SMTP_PORT`: mail server port, normally `587`
- `SMTP_USER`: SMTP username
- `SMTP_PASSWORD`: SMTP password
- `SMTP_FROM_EMAIL`: sender email address
- `CONTACT_DESTINATION_EMAIL`: support inbox for contact form submissions
- `CONTACT_BRAND_NAME`: brand label used in contact emails
- `API_BASE_URL`: backend base URL used when generating public file links
- `PUBLIC_VERIFY_BASE_URL`: verification page URL encoded into QR flows

### Important note

Do not put the service role key in the frontend `.env`. It must remain backend-only.

---

## 8. Frontend Environment Variables

Create `frontend/.env` with this content:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### What each frontend variable does

- `VITE_SUPABASE_URL`: same Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: public anonymous key for browser auth

---

## 9. Supabase Project Setup

You need a Supabase project before the app can work.

### In Supabase, collect these values

From Project Settings -> API, copy:

1. Project URL
2. `anon` public key
3. `service_role` key

Use them in the `.env` files above.

---

## 10. Database SQL Files to Run

This project depends on Supabase tables, policies, and storage configuration. Run these SQL files in the Supabase SQL Editor.

### Run in this order

1. `backend/database/supabase_schema.sql`
2. `database/profiles_schema.sql`
3. `database/authentication_details.sql`

### What they create

- `organizations`
- `app_users`
- `templates`
- `students`
- `certificates`
- `generated_certificates`
- `workspace_templates`
- `activities`
- `profiles`
- `access_requests`
- some indexes
- some triggers
- some RLS policies
- one storage bucket policy set for organization documents

### Important note about duplicate definitions

Some SQL files overlap on the `organizations` table. That is acceptable because they use `create table if not exists` and `create index if not exists`. Still, run them in the order above.

---

## 11. Manual Access-Control SQL

If you want the full organization-scoped admin/co-admin access-control system, also follow the SQL steps in:

- `ACCESS_CONTROL_SETUP.md`

That document includes additional backfill queries for:

- organization keys
- organization IDs
- `app_users.metadata`
- access-control metadata
- optional student backfill

If you skip that document, the app may still run, but the advanced access-control flows may be incomplete.

---

## 12. Storage Buckets You Need in Supabase

### Required bucket

Create this bucket manually in Supabase Storage:

1. `certificate-templates`

Set it to:

- Public = `true`

This is required because uploaded certificate template files are stored there and the backend expects a public URL.

### Also used by the project

1. `org-documents`
2. `Org_ids` optional legacy bucket name checked by the edge function

`org-documents` is referenced in SQL policies and access request validation.

---

## 13. Supabase Authentication Expectations

This project expects Supabase Auth to be active.

### The app uses

1. Email/password login in the frontend
2. Password reset flow
3. Invite/onboarding flow for approved access requests
4. User profile data linked through `profiles` and `app_users`

### Important data model note

Supabase Auth users live in `auth.users`, while app-specific role data lives in:

1. `profiles`
2. `app_users`

Both matter.

---

## 14. Optional Edge Function Setup

If you want the automated access-request approval flow, deploy the Supabase Edge Function located at:

```text
supabase/functions/process-access-request/index.ts
```

### Install Supabase CLI

Follow Supabase CLI installation for your OS, then log in:

```powershell
supabase login
```

### Link your project

```powershell
supabase link --project-ref YOUR_PROJECT_REF
```

### Set Edge Function secrets

```powershell
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
supabase secrets set APP_RESET_PASSWORD_URL=http://localhost:5173/reset-password?type=invite
supabase secrets set APP_LOGIN_URL=http://localhost:5173/login
supabase secrets set SMTP_HOST=smtp.yourprovider.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USER=your-smtp-user
supabase secrets set SMTP_PASSWORD=your-smtp-password
supabase secrets set SMTP_FROM_EMAIL=no-reply@yourdomain.com
```

### Deploy the function

```powershell
supabase functions deploy process-access-request
```

### If you skip this

The main app can still run, but automated access-request processing, invitation handling, and approval emails may not work.

---

## 15. Local Folder Setup

Some ignored folders are created automatically, but it is safe to create them manually first.

Create these folders if they do not exist:

```powershell
mkdir backend\uploads
mkdir backend\uploads\generated
mkdir uploads
mkdir uploads\templates
mkdir uploads\generated
```

### Notes

- The FastAPI app serves files from `backend/uploads`
- generated certificates are written to `backend/uploads/generated`
- missing upload folders can break certificate generation or previews

---

## 16. Start the Backend

From the project root:

```powershell
.\.venv\Scripts\Activate.ps1
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

If setup is correct, backend should start at:

```text
http://127.0.0.1:8000
```

---

## 17. Start the Frontend

Open a second terminal:

```powershell
cd frontend
npm run dev
```

The frontend should start at:

```text
http://localhost:5173
```

---

## 18. First Run Checklist

Before testing the app, confirm all of these are done:

1. Frontend dependencies installed
2. Backend dependencies installed
3. `backend/.env` created
4. `frontend/.env` created
5. Supabase project created
6. SQL files executed
7. `certificate-templates` bucket created and public
8. backend upload folders exist
9. backend running on port `8000`
10. frontend running on port `5173`

---

## 19. Useful Test URLs

Once both apps are running, test these locally:

1. Frontend home page: `http://localhost:5173`
2. Backend docs: `http://127.0.0.1:8000/docs`
3. Verification flow: `http://localhost:5173/verify`
4. Login page: `http://localhost:5173/login`

---

## 20. Common Problems and Fixes

### Problem: `Missing SUPABASE_URL`

Cause:

- `backend/.env` is missing or not loaded

Fix:

1. Create `backend/.env`
2. Add `SUPABASE_URL`
3. Add `SUPABASE_SERVICE_ROLE_KEY`
4. restart backend

### Problem: frontend shows auth not configured

Cause:

- `frontend/.env` missing `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY`

Fix:

1. create `frontend/.env`
2. add both values
3. restart Vite dev server

### Problem: template upload fails

Cause:

1. `certificate-templates` bucket does not exist
2. bucket is not public
3. `SUPABASE_URL` is wrong

Fix:

1. create bucket in Supabase Storage
2. make it public
3. check backend `.env`

### Problem: PDF preview generation fails

Cause:

1. `pdf2image` not installed
2. Poppler not installed

Fix:

1. run `pip install pdf2image`
2. install Poppler
3. add Poppler `bin` folder to `PATH`

### Problem: file upload endpoints fail with form-data errors

Cause:

- `python-multipart` is not installed

Fix:

```powershell
pip install python-multipart
```

### Problem: `EmailStr` validation errors or missing package

Cause:

- `email-validator` is not installed

Fix:

```powershell
pip install email-validator
```

### Problem: access request emails do not send

Cause:

1. SMTP values missing in backend or edge function secrets
2. edge function not deployed

Fix:

1. configure SMTP in `backend/.env`
2. configure SMTP in `supabase secrets`
3. deploy `process-access-request`

---

## 21. Recommended Local Installation Summary

If you want the shortest working path, do this in order:

1. Install Node.js, npm, Python, and create a Supabase project
2. Run `npm install` in `frontend`
3. Create `.venv` and install Python packages
4. Create `backend/.env`
5. Create `frontend/.env`
6. Run the SQL files in Supabase
7. Create the `certificate-templates` public bucket
8. Start backend with Uvicorn
9. Start frontend with Vite
10. Deploy the edge function only if you need access-request automation

---

## 22. Optional Improvement After Setup

This repository currently does not include a backend `requirements.txt` or env example files. After you get the project working, it is a good idea to create these locally:

1. `requirements.txt`
2. `.env.example`
3. `backend/.env.example`
4. `frontend/.env.example`

That will make future ZIP-based setup easier.
