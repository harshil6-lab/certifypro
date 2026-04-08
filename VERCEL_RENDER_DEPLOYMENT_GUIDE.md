# CertifyPro Deployment Guide: Vercel Frontend + Render Backend

This guide explains how to deploy this project with:

- frontend on Vercel
- backend on Render
- database, auth, and storage on Supabase

This guide is written for the current codebase as it exists today. It includes the production caveats that must be handled before the deployed app will work correctly.

---

## 1. Deployment Architecture

Production setup for this project should look like this:

1. Vercel hosts the React and Vite frontend.
2. Render hosts the FastAPI backend.
3. Supabase provides Postgres, Auth, and Storage.
4. SMTP sends invite and contact emails.

Example URLs:

- frontend: `https://certifypro.vercel.app`
- backend: `https://certifypro-backend.onrender.com`
- Supabase: `https://your-project.supabase.co`

---

## 2. What You Need Before Deploying

Prepare these first:

1. GitHub repository with this project pushed.
2. Vercel account.
3. Render account.
4. Supabase project.
5. SMTP credentials for production email sending.

You will also need these values ready:

- Supabase project URL
- Supabase anon key
- Supabase service role key
- final Vercel frontend URL
- final Render backend URL
- SMTP host
- SMTP port
- SMTP username
- SMTP password
- from email address

---

## 3. Important Production Caveats In This Repo

Do not skip this section. The current repository still contains local development assumptions.

### 3.1 Frontend has hardcoded localhost backend URLs

These frontend files currently call `http://127.0.0.1:8000` directly:

- `frontend/src/services/apiService.ts`
- `frontend/src/pages/Contact.tsx`
- `frontend/src/pages/ImportStudents.tsx`
- `frontend/src/pages/Generate.tsx`
- `frontend/src/pages/Templates.tsx`

Before deploying the frontend, replace every `http://127.0.0.1:8000` with your Render backend URL.

Example:

```text
https://certifypro-backend.onrender.com
```

### 3.2 Backend CORS is hardcoded for local origins

The backend file `backend/app/main.py` currently allows only localhost-style origins in the `allowed_origins` list.

Before production use, add your Vercel frontend domain to that list.

Example:

```python
"https://certifypro.vercel.app",
```

If you use a Vercel preview domain or custom domain, add those too.

### 3.3 Generated files are stored on the Render filesystem

The backend currently writes generated certificate files into local folders under `backend/uploads/generated` and serves them from `/uploads`.

Render filesystems are ephemeral. This means:

- generated files may disappear after restart or redeploy
- old generated certificate links may stop working

For a stronger production setup, generated output should eventually be moved to Supabase Storage or another persistent object store.

### 3.4 Backend public URL variables must be set in production

The backend builds file URLs and QR verification links from environment variables.

You must set these in Render:

- `API_BASE_URL`
- `PUBLIC_VERIFY_BASE_URL`

---

## 4. Step 1: Prepare Supabase For Production

Create a production Supabase project first.

### 4.1 Get your keys

From Supabase dashboard, copy these values:

1. Project URL
2. Anon key
3. Service role key

### 4.2 Run the SQL files

Run these SQL files in Supabase SQL Editor in this order:

1. `backend/database/supabase_schema.sql`
2. `database/profiles_schema.sql`
3. `database/authentication_details.sql`

### 4.3 Create the storage bucket

Create this bucket in Supabase Storage:

- `certificate-templates`

Recommended configuration:

- public bucket: enabled

### 4.4 Configure Supabase Auth URLs

Go to Supabase Auth settings and configure:

1. Site URL
2. Redirect URLs

Recommended values:

- site URL: your Vercel production URL
- redirect URL: `https://your-vercel-domain/reset-password?type=invite`
- redirect URL: `https://your-vercel-domain/**`

If you also use preview deployments, add the preview URLs too.

### 4.5 Optional: Deploy the Edge Function

If you use the access request workflow backed by Supabase Edge Functions, deploy:

- `supabase/functions/process-access-request`

Example command:

```bash
supabase functions deploy process-access-request
```

---

## 5. Step 2: Deploy Backend To Render

Deploy the backend before the frontend so you know the real backend URL.

### 5.1 Create a new Render Web Service

In Render:

1. Click New.
2. Choose Web Service.
3. Connect your GitHub repository.
4. Select the correct branch.

### 5.2 Render service settings

Use these values:

- Environment: `Python 3`
- Root Directory: leave empty and use repository root
- Build Command:

```bash
pip install --upgrade pip && pip install -r requirements.txt
```

- Start Command:

```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT
```

- Health Check Path:

```text
/docs
```

Choose a region close to your Supabase project.

### 5.3 Set Render environment variables

Add these environment variables in Render.

Required backend variables:

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
FRONTEND_ORIGINS=https://YOUR_VERCEL_DOMAIN
ACCESS_INVITE_REDIRECT_URL=https://YOUR_VERCEL_DOMAIN/reset-password?type=invite
API_BASE_URL=https://YOUR_RENDER_DOMAIN
PUBLIC_VERIFY_BASE_URL=https://YOUR_VERCEL_DOMAIN/verify
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=no-reply@yourdomain.com
CONTACT_DESTINATION_EMAIL=certifyprocare@gmail.com
CONTACT_BRAND_NAME=ElevateX
```

If you want to allow both production and preview frontend domains, separate them with commas inside `FRONTEND_ORIGINS`.

Example:

```env
FRONTEND_ORIGINS=https://certifypro.vercel.app,https://certifypro-git-main-yourteam.vercel.app
```

### 5.4 First backend deployment check

After Render deploys successfully, open these URLs:

1. `https://YOUR_RENDER_DOMAIN/docs`
2. `https://YOUR_RENDER_DOMAIN/openapi.json`

If both load, the FastAPI app is at least booting correctly.

---

## 6. Step 3: Make Production-Specific Code Updates Before Frontend Deploy

Because this repository still contains localhost references, update those before you deploy to Vercel.

### 6.1 Replace frontend localhost backend URLs

Replace all occurrences of:

```text
http://127.0.0.1:8000
```

with:

```text
https://YOUR_RENDER_DOMAIN
```

At minimum, update these files:

1. `frontend/src/services/apiService.ts`
2. `frontend/src/pages/Contact.tsx`
3. `frontend/src/pages/ImportStudents.tsx`
4. `frontend/src/pages/Generate.tsx`
5. `frontend/src/pages/Templates.tsx`

### 6.2 Add the Vercel origin to backend CORS

Update `backend/app/main.py` and add your production frontend domain to the `allowed_origins` list.

Example:

```python
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://certifypro.vercel.app",
]
```

If you use preview or custom domains, add them too.

### 6.3 Redeploy the backend after the CORS change

If you changed `backend/app/main.py`, push the code and let Render deploy again before deploying the frontend.

---

## 7. Step 4: Deploy Frontend To Vercel

### 7.1 Create a new Vercel project

In Vercel:

1. Click Add New.
2. Choose Project.
3. Import the GitHub repository.

### 7.2 Vercel project settings

Use these values:

- Framework Preset: `Vite`
- Root Directory: `frontend`
- Install Command:

```bash
npm install
```

- Build Command:

```bash
npm run build
```

- Output Directory:

```text
dist
```

### 7.3 Set Vercel environment variables

Add these variables in Vercel:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Important note:

- the current frontend code reads `VITE_SUPABASE_URL`
- the current frontend code reads `VITE_SUPABASE_ANON_KEY`
- the current frontend code does not consistently use `VITE_API_BASE_URL`

That is why the code replacement in Step 6.1 is currently required.

### 7.4 Deploy and verify the frontend

After Vercel finishes building:

1. open the Vercel app URL
2. open browser developer tools
3. confirm API calls go to Render, not localhost

---

## 8. Step 5: Connect Frontend, Backend, and Supabase

After both services are live, verify the integration settings again.

### 8.1 Confirm backend environment values

In Render, verify these point to production URLs:

- `FRONTEND_ORIGINS`
- `ACCESS_INVITE_REDIRECT_URL`
- `API_BASE_URL`
- `PUBLIC_VERIFY_BASE_URL`

### 8.2 Confirm Supabase Auth URLs

In Supabase, verify:

1. Site URL is the Vercel production URL.
2. Redirect URLs include reset-password and login flows.

### 8.3 Confirm frontend is using the right Supabase project

On Vercel, verify:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

---

## 9. Step 6: Smoke Test Production

Run this checklist after deployment.

### 9.1 Backend checks

1. Open `https://YOUR_RENDER_DOMAIN/docs`
2. Open `https://YOUR_RENDER_DOMAIN/openapi.json`
3. Confirm no startup crash in Render logs

### 9.2 Frontend checks

1. Open the Vercel production URL
2. Confirm the app loads without a blank screen
3. Confirm browser console does not show CORS errors
4. Confirm browser console does not show requests to `127.0.0.1`

### 9.3 Auth checks

1. Log in with a valid Supabase user
2. Confirm session handling works
3. Confirm reset-password and invite redirects land on the Vercel domain

### 9.4 Data checks

1. Open dashboard pages
2. Open templates page
3. Open generate page
4. Test contact form
5. Test student import
6. Test certificate generation
7. Test public verify page

### 9.5 Storage checks

1. Confirm template uploads work
2. Confirm uploaded files appear in Supabase Storage bucket `certificate-templates`

---

## 10. Troubleshooting

### Problem: Frontend loads but API requests fail

Check these first:

1. frontend still contains `http://127.0.0.1:8000`
2. Render backend URL is wrong
3. backend is sleeping or restarting

### Problem: Browser shows CORS errors

Cause:

- Vercel domain is not in `backend/app/main.py`
- backend was not redeployed after changing CORS

Fix:

1. add the Vercel domain to `allowed_origins`
2. push changes
3. redeploy Render service

### Problem: Invite email opens localhost reset-password page

Cause:

- `ACCESS_INVITE_REDIRECT_URL` is missing or still local

Fix:

```env
ACCESS_INVITE_REDIRECT_URL=https://YOUR_VERCEL_DOMAIN/reset-password?type=invite
```

### Problem: Generated certificate links stop working after redeploy

Cause:

- generated files are stored on Render's ephemeral filesystem

Fix:

1. move generated files to Supabase Storage
2. store public storage URLs instead of local `/uploads/generated/...` URLs

### Problem: QR code verify link points to localhost

Cause:

- `PUBLIC_VERIFY_BASE_URL` is missing or incorrect

Fix:

```env
PUBLIC_VERIFY_BASE_URL=https://YOUR_VERCEL_DOMAIN/verify
```

### Problem: API-generated file URLs point to localhost

Cause:

- `API_BASE_URL` is missing or incorrect

Fix:

```env
API_BASE_URL=https://YOUR_RENDER_DOMAIN
```

---

## 11. Recommended Deployment Order

Use this order to avoid confusion:

1. create production Supabase project
2. run SQL schema files
3. create Supabase storage bucket
4. deploy backend to Render
5. copy final Render URL
6. replace frontend localhost API URLs with the Render URL
7. add Vercel domain to backend CORS list
8. redeploy backend
9. deploy frontend to Vercel
10. configure Supabase Auth URLs for Vercel
11. run production smoke tests

---

## 12. Production Hardening Recommendations

The app can be deployed with the steps above, but these improvements are strongly recommended:

1. replace hardcoded frontend API URLs with a single env-based API config
2. replace hardcoded backend CORS list with environment-driven origins
3. move generated certificate output from local disk to Supabase Storage
4. add dedicated `.env.example` files for frontend and backend
5. add `render.yaml` and `vercel.json` only if you want deployment to be fully codified in the repo

---

## 13. Minimum Production Environment Variable Summary

### Vercel

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Render

```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
FRONTEND_ORIGINS=https://YOUR_VERCEL_DOMAIN
ACCESS_INVITE_REDIRECT_URL=https://YOUR_VERCEL_DOMAIN/reset-password?type=invite
API_BASE_URL=https://YOUR_RENDER_DOMAIN
PUBLIC_VERIFY_BASE_URL=https://YOUR_VERCEL_DOMAIN/verify
SMTP_HOST=smtp.yourprovider.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
SMTP_FROM_EMAIL=no-reply@yourdomain.com
CONTACT_DESTINATION_EMAIL=certifyprocare@gmail.com
CONTACT_BRAND_NAME=ElevateX
```

---

## 14. Final Note

This repository is deployable, but not yet fully production-abstracted. The main reason is that some backend origins and frontend API URLs are still hardcoded for local development.

If you follow this guide carefully, you can still deploy the current project to:

- Vercel for frontend
- Render for backend
- Supabase for database, auth, and storage

For a cleaner long-term setup, the next step should be removing the hardcoded URLs and moving generated files to persistent cloud storage.