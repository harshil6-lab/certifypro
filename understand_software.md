# CertifyPro Software Guide

This document explains this project as if the reader is new to software projects. It covers what the software does, how the frontend and backend talk to each other, what each dependency is used for, how authentication works, what the important files do, and where each business feature lives.

This guide is written for this repository only.

## 1. What This Project Is

CertifyPro is a certificate management platform.

Its main jobs are:

1. Let an institution admin request access to the system.
2. Let authenticated admins manage templates.
3. Import student data from Excel or CSV.
4. Generate certificate images in bulk.
5. Store certificate records and verification links.
6. Let anyone verify a certificate publicly.
7. Let admins manage profile data, dashboard metrics, and access control.

In simple words:

- The frontend is the website users see.
- The backend is the server that processes data and talks to the database.
- Supabase acts as the database, authentication provider, storage service, and function runtime.

## 2. Important Definitions

These terms are used throughout the codebase.

| Term | Meaning in simple words | How this project uses it |
| --- | --- | --- |
| Frontend | The visible website/UI | React + Vite app in `frontend/` |
| Backend | The server-side application | FastAPI app in `backend/app/` |
| API | A set of URLs the frontend calls | FastAPI routes like `/dashboard/stats`, `/api/templates`, `/api/generate-certificates` |
| Route | A specific API endpoint | Example: `backend/app/api/auth_routes.py` |
| Service | Business logic layer | Example: `backend/app/services/profile_service.py` |
| Middleware | Code that runs before routes | `auth_middleware.py` checks auth on protected paths |
| Supabase | Backend platform with database, auth, storage, functions | Used for user auth, tables, buckets, Edge Functions |
| Auth | Login and identity system | Supabase Auth handles email/password, sessions, invites |
| JWT / Access Token | Short-lived proof that the user is logged in | Frontend sends it in `Authorization: Bearer ...` |
| Service Role Key | Highly privileged Supabase secret | Backend uses it to read/write protected data |
| Edge Function | Serverless function hosted by Supabase | `process-access-request` scores access requests |
| Storage Bucket | File storage container | Used for org documents and template files |
| Template | Background design for a certificate | Stored in `templates` table and storage |
| Layout Config | Coordinates for where name/QR/ID should appear on a certificate | Stored as JSON |
| QR Token | Secret token encoded into QR | Used to verify certificate authenticity |
| RLS | Row Level Security in Postgres/Supabase | SQL files define policies for some tables |
| Onboarding | First-time profile completion flow | Used on dashboard/profile and login redirect logic |

## 3. High-Level Architecture

The system has four main parts.

### 3.1 Frontend

Location: `frontend/`

Built with:

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui + Radix UI
- Supabase JS client

What it does:

- Shows public marketing pages.
- Shows login and password reset screens.
- Shows the admin dashboard.
- Uploads files.
- Calls backend APIs.
- Talks to Supabase Auth from the browser.

### 3.2 Backend

Location: `backend/app/`

Built with:

- FastAPI
- Python
- Supabase Python client
- Pandas / OpenPyXL / Pillow / QR code libraries

What it does:

- Validates user tokens.
- Returns dashboard/profile/access-control data.
- Saves templates and student records.
- Generates certificate files.
- Serves uploaded/generated files from `/uploads`.
- Sends contact emails.

### 3.3 Supabase

Used for:

- Authentication.
- Database tables.
- Storage buckets.
- Edge Function execution.

Main tables seen in this repo:

- `organizations`
- `access_requests`
- `app_users`
- `templates`
- `students`
- `certificates`
- `generated_certificates`
- `workspace_templates`
- `activities`
- `profiles` (older/alternate profile design also documented in SQL)

### 3.4 File Storage

This project stores files in two ways:

1. Supabase Storage
   Used for uploaded organization documents and template files.
2. Local backend filesystem
   Used for generated certificate images and zip files in `backend/uploads/generated/`.

Important note:

- Local generated files are fine for local development.
- On platforms like Render, local disk is not durable in the long term.

## 4. End-to-End Feature Logic

This is the easiest way to understand the software.

### 4.1 Admin Access Request Flow

Purpose:

- A person who does not yet have admin access can request it from the login page.

How it works:

1. The modal `frontend/src/components/AdminAccessRequestModal.tsx` collects identity and organization information.
2. The helper `frontend/src/lib/accessRequest.ts` validates the file type and uploads the organization proof document to Supabase Storage.
3. It inserts a row in the `access_requests` table.
4. It invokes the Supabase Edge Function `supabase/functions/process-access-request/index.ts`.
5. That function scores the request.
6. If approved, it can invite the user through Supabase Auth and create/update application-level records.
7. The request ends up marked as `approved`, `hold`, or `rejected`.

Why this matters:

- This is the gate before a user becomes an admin in the main product.

### 4.2 Authentication Flow

Purpose:

- Allow users to sign in securely and allow the backend to know who is calling it.

How it works in this repo:

1. Frontend uses Supabase JS client from `frontend/src/lib/supabaseClient.ts`.
2. Login UI in `frontend/src/pages/Login.tsx` calls `signInWithEmailPassword` from `frontend/src/lib/auth.ts`.
3. Supabase Auth creates and stores the session in the browser.
4. Frontend reads the session access token.
5. When calling backend protected routes, the frontend sends `Authorization: Bearer <token>`.
6. Backend validates the token using `backend/app/services/auth_service.py`.
7. Protected route handlers extract the user identity from the validated payload.

Important auth files:

- `frontend/src/lib/supabaseClient.ts`
- `frontend/src/lib/auth.ts`
- `backend/app/api/auth_routes.py`
- `backend/app/services/auth_service.py`
- `backend/app/middleware/auth_middleware.py`

Important behavior:

- `AuthMiddleware` currently protects only selected prefixes by default, especially `/user`.
- Several other routes perform explicit token validation inside the route itself.
- Email verification status is checked on the frontend before treating a session as fully authenticated.
- The first-login requirement is stored in user metadata / profile metadata and used to redirect users into security/profile completion flows.

### 4.3 Profile and Onboarding Flow

Purpose:

- Every admin should have a usable profile with organization and role-related metadata.

How it works:

1. `frontend/src/lib/auth.ts` fetches the current profile from `/user/profile`.
2. `backend/app/api/user_routes.py` reads the authenticated user.
3. It uses `backend/app/services/profile_service.py` for database-backed profile operations.
4. If a profile is missing, it can bootstrap membership using `ensure_actor_membership` from the access control service.
5. Profile completion removes the first-login requirement.

Important detail:

- There are two concepts in the repo: an older `profiles` SQL design and the active `app_users.metadata.profile` approach. The live backend routes use `app_users` and metadata heavily.

### 4.4 Template Management Flow

Purpose:

- Let admins choose official templates or upload custom ones.

How it works:

1. `frontend/src/pages/Templates.tsx` loads official templates through `getTemplates`.
2. Backend route `backend/app/api/templates_routes.py` returns template records from the `templates` table.
3. When a custom template is uploaded, `backend/app/services/template_service.py` uploads the file to Supabase Storage.
4. A template row is created in the `templates` table.
5. Layout changes are saved as JSON using template layout endpoints.
6. Workspace-specific template selection is handled through `workspace_templates` routes and data.

Why layout config matters:

- It tells the generator where to draw the student name, QR code, and certificate ID.

### 4.5 Student Import Flow

Purpose:

- Load students in bulk before generating certificates.

How it works:

1. `frontend/src/pages/ImportStudents.tsx` uploads an Excel file for preview.
2. Backend route `backend/app/api/generate_routes.py` parses Excel and marks rows as valid, error, or duplicate.
3. Frontend shows the preview table.
4. On save, frontend calls `backend/app/api/import_students.py`.
5. That route validates rows again and inserts valid students into `students`.
6. `students_service.py` adds organization-aware metadata to each student.

Important note:

- There are two import approaches in the repo.
- `students_routes.py` supports CSV-based import.
- `import_students.py` is the main Excel validation/save flow currently used by the frontend.

### 4.6 Certificate Generation Flow

Purpose:

- Create certificate image files for one or many students.

How it works:

1. `frontend/src/pages/Generate.tsx` loads the active template and student list.
2. It sends a request to `backend/app/api/generate_certificates.py`.
3. That route fetches the template image and layout configuration.
4. It creates QR codes and draws student text onto the template using Pillow.
5. Output files are written to `backend/uploads/generated/`.
6. Generated certificate metadata is written to the database.
7. A zip can be produced for bulk download.

Important note:

- There is also `generate_service.py` and `generate_routes.py`, which implement an alternate generation path.
- In practice, the frontend page `Generate.tsx` relies on `generate_certificates.py` for the main user flow.

### 4.7 Verification Flow

Purpose:

- Let the public confirm whether a certificate is valid.

Two verification styles exist in this repo:

1. `backend/app/api/verify.py`
   Looks up the `students` table by `external_id`.
2. `backend/app/api/verify_routes.py`
   Verifies certificate authenticity by QR token using the `certificates` table.

Why there are two:

- One is public ID-based verification for human-friendly certificate IDs.
- The other is token-based verification for stronger QR-based authenticity checks.

### 4.8 Dashboard and Registry Flow

Purpose:

- Give admins a view of counts, activity, and generated outputs.

How it works:

1. Frontend dashboard page calls `/dashboard/stats`.
2. Backend `dashboard_service.py` counts templates, students, generated certificates, and admins for the current scope.
3. Registry page relies on `students_ready.py` endpoints such as `/api/my-certificates`.
4. Expired generated file cleanup is handled by `generated_certificate_retention_service.py`.

### 4.9 Contact Form Flow

Purpose:

- Let public users send a contact/support message.

How it works:

1. Frontend contact page sends form data.
2. Backend `contact_routes.py` validates it.
3. `contact_service.py` sends an email using SMTP.

## 5. Main Database Logic

Below is the simplest mental model for the main tables.

| Table | What it stores | Why it exists |
| --- | --- | --- |
| `organizations` | Canonical organization records | Prevent duplicate organization identities |
| `access_requests` | Pending/approved/rejected admin requests | Entry point for onboarding admins |
| `app_users` | Application-specific user data and metadata | Stores roles, profile metadata, access-control state |
| `templates` | Official and custom certificate templates | Base images and metadata for certificate creation |
| `workspace_templates` | User-specific active template/layout selection | Keeps each admin's working template context |
| `students` | Imported student records | Used to generate certificates |
| `certificates` | Logical certificate records | Verification and issuance data |
| `generated_certificates` | Generated output file records | Download URLs, generated file tracking |
| `activities` | Activity log | Dashboard recent activity |
| `profiles` | Alternate/older profile table design | Documented in SQL but not the main active runtime path |

## 6. Project Dependencies Explained

This section explains every declared dependency and why it exists.

### 6.1 Frontend Runtime Dependencies

Source: `frontend/package.json`

| Package | Use in this project |
| --- | --- |
| `@hookform/resolvers` | Connects React Hook Form with validation libraries such as Zod |
| `@radix-ui/react-accordion` | Accordion UI primitive |
| `@radix-ui/react-alert-dialog` | Confirmation dialogs |
| `@radix-ui/react-aspect-ratio` | Responsive media sizing |
| `@radix-ui/react-avatar` | User/profile avatar UI |
| `@radix-ui/react-checkbox` | Checkbox UI |
| `@radix-ui/react-collapsible` | Expand/collapse blocks |
| `@radix-ui/react-context-menu` | Right-click/context menu UI |
| `@radix-ui/react-dialog` | Modal dialog base |
| `@radix-ui/react-dropdown-menu` | Dropdown menus |
| `@radix-ui/react-hover-card` | Hover info cards |
| `@radix-ui/react-label` | Accessible form labels |
| `@radix-ui/react-menubar` | Menu bar primitives |
| `@radix-ui/react-navigation-menu` | Navigation/menu patterns |
| `@radix-ui/react-popover` | Small overlay content panels |
| `@radix-ui/react-progress` | Progress bar base |
| `@radix-ui/react-radio-group` | Radio button groups |
| `@radix-ui/react-scroll-area` | Styled scroll containers |
| `@radix-ui/react-select` | Select dropdowns |
| `@radix-ui/react-separator` | Horizontal/vertical separators |
| `@radix-ui/react-slider` | Slider inputs |
| `@radix-ui/react-slot` | Component composition helper used by shadcn/ui |
| `@radix-ui/react-switch` | Toggle switches |
| `@radix-ui/react-tabs` | Tabs UI |
| `@radix-ui/react-toast` | Toast notifications base |
| `@radix-ui/react-toggle` | Toggle buttons |
| `@radix-ui/react-toggle-group` | Grouped toggles |
| `@radix-ui/react-tooltip` | Tooltips |
| `@react-three/drei` | Helper library for React Three Fiber 3D components |
| `@react-three/fiber` | React renderer for Three.js, used for 3D landing visuals |
| `@supabase/supabase-js` | Browser client for Supabase auth, storage, database, functions |
| `@tanstack/react-query` | Server-state and request caching layer |
| `axios` | HTTP client used in several pages for backend requests |
| `class-variance-authority` | Variant-based class management for reusable UI components |
| `clsx` | Conditional class name helper |
| `cmdk` | Command palette style UI primitives |
| `date-fns` | Date formatting and date utilities |
| `embla-carousel-react` | Carousel component support |
| `framer-motion` | Animation library |
| `input-otp` | OTP input UI support |
| `lucide-react` | Icon library used throughout the UI |
| `next-themes` | Theme switching support |
| `react` | Core UI library |
| `react-day-picker` | Date picker/calendar UI |
| `react-dom` | React DOM renderer |
| `react-hook-form` | Form state management |
| `react-resizable-panels` | Resizable panel layouts |
| `react-router-dom` | Client-side routing |
| `recharts` | Charting and dashboard graphs |
| `sonner` | Toast notifications |
| `tailwind-merge` | Merges Tailwind class strings safely |
| `tailwindcss-animate` | Tailwind animation helpers |
| `three` | 3D engine used by React Three Fiber |
| `vaul` | Drawer/sheet UI patterns |
| `zod` | Schema validation, especially useful with forms |

### 6.2 Frontend Development Dependencies

| Package | Use in this project |
| --- | --- |
| `@eslint/js` | ESLint core rules |
| `@tailwindcss/typography` | Better prose and content styling |
| `@testing-library/jest-dom` | Better DOM assertions in tests |
| `@testing-library/react` | React component testing |
| `@types/node` | Node.js TypeScript types |
| `@types/react` | React TypeScript types |
| `@types/react-dom` | React DOM TypeScript types |
| `@vitejs/plugin-react-swc` | Vite plugin for React with SWC compiler |
| `autoprefixer` | CSS vendor prefix handling |
| `eslint` | Linting |
| `eslint-plugin-react-hooks` | Rules for React hooks |
| `eslint-plugin-react-refresh` | React refresh-related linting |
| `globals` | Known JavaScript globals for lint configuration |
| `jsdom` | Browser-like environment for tests |
| `lovable-tagger` | Development plugin used in Vite dev mode |
| `postcss` | CSS transformation pipeline |
| `tailwindcss` | Utility-first CSS framework |
| `typescript` | Type system for frontend code |
| `typescript-eslint` | ESLint support for TypeScript |
| `vite` | Dev server and bundler |
| `vitest` | Test runner |

### 6.3 Backend Python Dependencies

Source: `requirements.txt`

| Package | Use in this project |
| --- | --- |
| `fastapi` | Backend web framework |
| `uvicorn[standard]` | ASGI server to run FastAPI |
| `pydantic` | Request validation and models |
| `python-dotenv` | Loads `.env` values into Python process |
| `supabase` | Python client for Supabase database/auth/storage |
| `requests` | Sync HTTP calls, used in auth fallbacks |
| `httpx` | Async HTTP client, used for downloading template images |
| `qrcode[pil]` | Generates QR codes for certificates |
| `Pillow` | Image processing and drawing on certificates |
| `pandas` | Excel validation/parsing in import flow |
| `openpyxl` | Excel workbook parsing |
| `python-multipart` | Handles file uploads in FastAPI |
| `email-validator` | Email validation support for Pydantic `EmailStr` |

### 6.4 Optional or Undeclared Backend Dependencies Used by the Code

These are important because the code references them directly.

| Package / Tool | Why it may be needed |
| --- | --- |
| `pdf2image` | `template_service.py` uses it to generate preview images when a PDF template is uploaded |
| Poppler | External system dependency required by `pdf2image` on many machines |
| `smtplib` | Built into Python, used to send contact emails |
| `email.message` | Built into Python, used to construct email payloads |

## 7. Authentication Logic Explained Slowly

This section is important because auth touches many files.

### 7.1 Frontend Auth Files

| File | Responsibility |
| --- | --- |
| `frontend/src/lib/supabaseClient.ts` | Creates the browser-side Supabase client from env values |
| `frontend/src/lib/auth.ts` | Main auth helper: session restore, sign-in, sign-out, password reset, profile fetch, first-login checks |
| `frontend/src/pages/Login.tsx` | Sign-in page and public entry point to access request and verification dialogs |
| `frontend/src/pages/ResetPassword.tsx` | Password reset flow after email link |
| `frontend/src/App.tsx` | Protects admin routes based on session state |

### 7.2 Backend Auth Files

| File | Responsibility |
| --- | --- |
| `backend/app/api/auth_routes.py` | Lightweight auth endpoints like `/login`, `/me`, `/logout` |
| `backend/app/services/auth_service.py` | Validates tokens and talks to Supabase Auth |
| `backend/app/middleware/auth_middleware.py` | Middleware that blocks protected routes without a valid bearer token |
| `backend/app/core/supabase_client.py` | Creates the server-side Supabase client using privileged secrets |

### 7.3 Auth Sequence

1. User enters email/password on the login page.
2. Frontend sends the credentials to Supabase Auth.
3. Supabase returns a session and access token.
4. Frontend stores auth state locally.
5. When frontend calls the backend, it attaches the access token.
6. Backend validates token with Supabase.
7. Backend routes use the user ID and email for scoping database queries.

### 7.4 Role and Access Logic

This project has two different levels of access logic:

1. Authentication
   Means "Are you logged in?"
2. Authorization / Access Control
   Means "What are you allowed to use?"

Access control is mainly implemented in:

- `backend/app/services/access_control_service.py`
- `backend/app/api/access_control_routes.py`
- `frontend/src/context/AccessControlContext.tsx`
- `frontend/src/components/AdminLayout.tsx`

This system decides whether the current user is:

- `super_admin`
- `admin`
- `co_admin`

And whether the user can access:

- dashboard
- templates
- import_students
- generate
- registry
- access_control

## 8. File and Folder Map

This section explains the main files and folders in the repo.

### 8.1 Root Files

| File / Folder | Purpose |
| --- | --- |
| `.env` | Central environment template for local development |
| `README.md` | Main project overview |
| `Guide.md` | Setup guide for installing the software on a new machine |
| `VERCEL_RENDER_DEPLOYMENT_GUIDE.md` | Deployment guide for Vercel + Render |
| `ACCESS_CONTROL_SETUP.md` | Access-control specific setup notes |
| `BACKEND_FIXES_SUMMARY.md` | Notes on backend fixes |
| `DEPLOYMENT_CHECKLIST.md` | Deployment checklist |
| `FILES_CHANGED_MANIFEST.md` | Change inventory document |
| `IMPLEMENTATION_DETAILS.md` | Project implementation notes |
| `PRODUCTION_UI_IMPROVEMENTS.md` | UI improvement notes |
| `PROFILES_SYSTEM_IMPLEMENTATION.md` | Profile system notes |
| `PROFILES_SYSTEM_SUMMARY.md` | Profile system summary |
| `QUICK_REFERENCE.md` | Quick developer reference |
| `requirements.txt` | Backend Python dependency list |
| `backend/` | FastAPI backend |
| `database/` | SQL files stored at repo root |
| `docs/` | Extra documentation area |
| `frontend/` | React frontend |
| `supabase/` | Supabase functions and related code |
| `uploads/` | Root-level uploaded template assets |

### 8.2 Backend Folder Map

#### `backend/app/main.py`

This is the backend entry point.

It does four important things:

1. Creates the FastAPI app.
2. Registers middleware and CORS.
3. Includes all route modules.
4. Mounts `uploads` as a static file folder.

#### `backend/app/core/`

| File | Purpose |
| --- | --- |
| `config.py` | Reads environment settings such as Supabase URL, SMTP, frontend origins |
| `supabase_client.py` | Creates the privileged Supabase client for backend use |
| `__init__.py` | Package marker |

#### `backend/app/middleware/`

| File | Purpose |
| --- | --- |
| `auth_middleware.py` | Validates bearer tokens on protected route prefixes |
| `__init__.py` | Package marker |

#### `backend/app/api/`

These files expose backend HTTP endpoints.

| File | Purpose |
| --- | --- |
| `access_control_routes.py` | Access overview, invite member, update permissions, remove member |
| `auth_routes.py` | Login helper, current user check, logout |
| `certificates_routes.py` | Older/admin certificate generation and certificate list endpoints |
| `contact_routes.py` | Public contact form API |
| `dashboard_routes.py` | Dashboard statistics and recent activity |
| `generate_certificates.py` | Main bulk certificate image generation route used by the Generate page |
| `generate_routes.py` | Excel preview and alternate certificate generation path |
| `import_students.py` | Validate Excel and save students into the database |
| `students_ready.py` | Returns students ready for generation and certificate registry data |
| `students_routes.py` | CSV-style student import and student listing |
| `templates_routes.py` | Template listing, creation, upload, deletion, layout save |
| `user_routes.py` | Get and update user profile, complete first login |
| `verify.py` | Public verification by certificate external ID |
| `verify_routes.py` | Public verification by QR token |
| `workspace_template.py` | Gets and saves the current active workspace template/layout |
| `__init__.py` | Package marker |

#### `backend/app/services/`

These files hold business logic and database-related helpers.

| File | Purpose |
| --- | --- |
| `_supabase_helpers.py` | Small helper wrappers for select/insert/delete/RPC operations |
| `access_control_service.py` | Core membership, permission, organization, and invite logic |
| `auth_service.py` | Token validation and magic-link related helpers |
| `certificate_service.py` | Generates logical certificate records with QR token logic |
| `certificates_service.py` | Lists certificates and legacy generation support |
| `contact_service.py` | Sends contact emails via SMTP |
| `dashboard_service.py` | Computes dashboard counts and recent activity |
| `generate_service.py` | Parses Excel and generates certificate images in an alternate pipeline |
| `generated_certificate_retention_service.py` | Deletes expired generated files and computes retention status |
| `profile_service.py` | Reads and updates user profile metadata in `app_users` |
| `students_service.py` | Resolves student visibility scope, parses CSV, bulk inserts students |
| `template_gallery_seed.py` | Seeds official gallery templates |
| `template_service.py` | Uploads template files to storage and saves layout data |
| `templates_service.py` | Lists, creates, deletes, and seeds template rows |
| `user_service.py` | Placeholder user service left for backward compatibility, not the main profile implementation |
| `verify_service.py` | Verifies certificates by QR token |
| `__init__.py` | Package marker |

#### `backend/database/`

| File | Purpose |
| --- | --- |
| `schema.sql` | Database schema placeholder / older backend DB script location |
| `supabase_schema.sql` | Main Supabase database schema for app tables |

#### `backend/uploads/`

| Folder | Purpose |
| --- | --- |
| `generated/` | Stores generated certificate image files and zip outputs |

### 8.3 Root Database SQL Folder

| File | Purpose |
| --- | --- |
| `database/authentication_details.sql` | SQL for organizations, access requests, org document bucket, and related policies |
| `database/profiles_schema.sql` | Alternate profile schema and RLS policies |
| `.gitkeep` | Keeps the folder in Git |

### 8.4 Supabase Functions Folder

| File / Folder | Purpose |
| --- | --- |
| `supabase/functions/process-access-request/index.ts` | Scores access requests, creates/invites users, updates status |
| `supabase/functions/_shared/cors.ts` | Shared CORS headers/helper |
| `supabase/functions/_shared/email.ts` | Shared email templates and sending helper logic for the function |

### 8.5 Frontend Configuration Files

| File | Purpose |
| --- | --- |
| `frontend/package.json` | Frontend scripts and dependency list |
| `frontend/bun.lockb` | Bun lock file |
| `frontend/components.json` | shadcn/ui component configuration |
| `frontend/eslint.config.js` | ESLint configuration |
| `frontend/index.html` | Vite HTML shell |
| `frontend/postcss.config.js` | PostCSS configuration |
| `frontend/tailwind.config.ts` | Tailwind theme/config |
| `frontend/tsconfig.app.json` | App TypeScript config |
| `frontend/tsconfig.json` | Base TypeScript config |
| `frontend/tsconfig.node.json` | Node/tooling TypeScript config |
| `frontend/vite.config.ts` | Vite config, alias config, dev server port 8080, envDir set to repo root |
| `frontend/vitest.config.ts` | Vitest test configuration |
| `frontend/README.md` | Frontend-specific notes |

### 8.6 Frontend App Entry Files

| File | Purpose |
| --- | --- |
| `frontend/src/main.tsx` | Browser entry point; sets favicon and renders `<App />` |
| `frontend/src/App.tsx` | Defines routes and protects admin area |
| `frontend/src/index.css` | Global styles |
| `frontend/src/App.css` | App-level styles |
| `frontend/src/vite-env.d.ts` | Vite TypeScript environment declarations |

### 8.7 Frontend Pages

| File | Purpose |
| --- | --- |
| `About.tsx` | Public about page |
| `AccessControl.tsx` | Admin UI for managing access members and permissions |
| `CompleteProfile.tsx` | First-time profile completion page |
| `Contact.tsx` | Public contact page |
| `Dashboard.tsx` | Admin home page with metrics and workflow guidance |
| `DashboardTemplates.tsx` | Admin view related to templates |
| `FeaturesPage.tsx` | Public feature explanation page |
| `Generate.tsx` | Main certificate generation UI |
| `Help.tsx` | User guide/help page |
| `ImportStudents.tsx` | Import and validate student data |
| `Index.tsx` | Public landing page |
| `Login.tsx` | Login screen and entry point for request access / public verification modals |
| `NotFound.tsx` | 404 page |
| `PrivacyPolicy.tsx` | Privacy policy page |
| `Profile.tsx` | Admin profile, security, and activity view |
| `Registry.tsx` | Admin certificate registry/download page |
| `ResetPassword.tsx` | Password reset completion screen |
| `Templates.tsx` | Template gallery and workspace template editor |
| `Verify.tsx` | Public verification form page |
| `VerifyResult.tsx` | Verification result view |

### 8.8 Frontend Components

#### Core admin/public components

| File | Purpose |
| --- | --- |
| `AdminAccessRequestModal.tsx` | Multi-step modal to request admin access |
| `AdminLayout.tsx` | Wraps admin routes with access-control provider and permission checks |
| `AdminNavbar.tsx` | Main admin navigation bar |
| `AdminSidebar.tsx` | Sidebar navigation component |
| `LayoutPreview.tsx` | Visual preview of certificate layout positions |
| `NavLink.tsx` | Navigation link helper component |
| `ProfileOnboardingModal.tsx` | Dashboard onboarding modal for admin info |
| `PublicCertificateVerificationModal.tsx` | Public modal to verify certificates |

#### Landing components

| File | Purpose |
| --- | --- |
| `landing/CategoryCube3D.tsx` | 3D landing-page visual using Three.js helpers |
| `landing/CertificateGallerySection.tsx` | Public gallery section |
| `landing/LandingFooter.tsx` | Public footer |
| `landing/PublicNavbar.tsx` | Public site navigation bar |
| `landing/TrustedInstitutionsSection.tsx` | Public trust/social-proof section |

#### Template components

| File | Purpose |
| --- | --- |
| `templates/TemplateCard.tsx` | Individual template card |
| `templates/TemplatePreviewModal.tsx` | Template preview modal |

#### Certificate components

| File | Purpose |
| --- | --- |
| `certificates/CertificateEditorModal.tsx` | Certificate editing modal |
| `certificates/CertificateTemplate.tsx` | Certificate preview/render component |
| `certificates/types.ts` | Certificate-related TypeScript types |
| `certificates/CertificateStyles/styles.ts` | Style preset definitions for certificates |

#### UI primitives

These files are reusable presentational building blocks. Most are wrappers around Radix UI plus Tailwind styling.

| File | Purpose |
| --- | --- |
| `ui/accordion.tsx` | Accordion UI |
| `ui/alert-dialog.tsx` | Confirm dialog UI |
| `ui/alert.tsx` | Alert message box |
| `ui/aspect-ratio.tsx` | Aspect ratio container |
| `ui/avatar.tsx` | Avatar UI |
| `ui/badge.tsx` | Badge UI |
| `ui/breadcrumb.tsx` | Breadcrumb navigation |
| `ui/button.tsx` | Button component |
| `ui/calendar.tsx` | Calendar/date picker UI |
| `ui/card.tsx` | Card layout component |
| `ui/carousel.tsx` | Carousel UI |
| `ui/chart.tsx` | Chart wrapper components |
| `ui/checkbox.tsx` | Checkbox UI |
| `ui/collapsible.tsx` | Collapsible section UI |
| `ui/command.tsx` | Command menu UI |
| `ui/context-menu.tsx` | Context menu UI |
| `ui/dialog.tsx` | Modal dialog UI |
| `ui/drawer.tsx` | Drawer/panel UI |
| `ui/dropdown-menu.tsx` | Dropdown menu UI |
| `ui/form.tsx` | Form helpers |
| `ui/hover-card.tsx` | Hover card UI |
| `ui/input-otp.tsx` | OTP input component |
| `ui/input.tsx` | Text input UI |
| `ui/label.tsx` | Form label UI |
| `ui/menubar.tsx` | Menubar UI |
| `ui/navigation-menu.tsx` | Navigation menu UI |
| `ui/pagination.tsx` | Pagination controls |
| `ui/popover.tsx` | Popover UI |
| `ui/progress.tsx` | Progress bar UI |
| `ui/radio-group.tsx` | Radio group UI |
| `ui/resizable.tsx` | Resizable panel UI |
| `ui/scroll-area.tsx` | Scrollable area UI |
| `ui/select.tsx` | Select dropdown UI |
| `ui/separator.tsx` | Divider/separator |
| `ui/sheet.tsx` | Sheet/side panel UI |
| `ui/sidebar.tsx` | Sidebar UI primitive |
| `ui/skeleton.tsx` | Loading skeleton UI |
| `ui/slider.tsx` | Slider input UI |
| `ui/sonner.tsx` | Sonner toast wrapper |
| `ui/switch.tsx` | Switch/toggle UI |
| `ui/table.tsx` | Table UI |
| `ui/tabs.tsx` | Tabs UI |
| `ui/textarea.tsx` | Textarea UI |
| `ui/toast.tsx` | Toast primitive |
| `ui/toaster.tsx` | Toast renderer |
| `ui/toggle-group.tsx` | Toggle group UI |
| `ui/toggle.tsx` | Toggle UI |
| `ui/tooltip.tsx` | Tooltip UI |
| `ui/use-toast.ts` | Toast state helper |

### 8.9 Frontend Context, Hooks, Services, Lib, Data, Types

#### `frontend/src/context/`

| File | Purpose |
| --- | --- |
| `AccessControlContext.tsx` | Loads access-control overview, exposes permission checks, manages invite/update/remove actions |

#### `frontend/src/hooks/`

| File | Purpose |
| --- | --- |
| `use-mobile.tsx` | Mobile viewport helper |
| `use-toast.ts` | Toast hook |
| `useAdminOnboarding.ts` | Stores lightweight onboarding completion state in localStorage |

#### `frontend/src/services/`

| File | Purpose |
| --- | --- |
| `apiService.ts` | Shared fetch helpers and backend API base constant |
| `sessionActivity.ts` | Session-only activity log stored in sessionStorage |

#### `frontend/src/lib/`

| File | Purpose |
| --- | --- |
| `accessRequest.ts` | Submit access requests and upload organization documents |
| `auth.ts` | Main frontend auth/profile helpers |
| `layoutConfig.ts` | Normalizes and stores certificate layout configuration |
| `mockTemplateApi.ts` | Mock template API helpers |
| `supabaseClient.ts` | Creates frontend Supabase client |
| `utils.ts` | Utility helpers like class name merging |

#### `frontend/src/data/`

| File | Purpose |
| --- | --- |
| `certificateTemplates.json` | Static template-related data |
| `mockTemplates.ts` | Mock template dataset |

#### `frontend/src/types/`

| File | Purpose |
| --- | --- |
| `template.ts` | Template TypeScript types |

### 8.10 Public Assets and Upload Folders

| Path | Purpose |
| --- | --- |
| `frontend/public/assets/template-library/` | Public template assets for frontend display |
| `frontend/src/assets/` | Imported frontend static assets |
| `uploads/templates/` | Repository-level uploaded template storage area |
| `backend/uploads/generated/` | Generated certificates and zip outputs |

## 9. Important Files by Business Feature

If you want to change a feature, start here.

| Feature | Main files to inspect first |
| --- | --- |
| Login and session restore | `frontend/src/pages/Login.tsx`, `frontend/src/lib/auth.ts`, `frontend/src/lib/supabaseClient.ts`, `backend/app/services/auth_service.py` |
| Access request | `frontend/src/components/AdminAccessRequestModal.tsx`, `frontend/src/lib/accessRequest.ts`, `supabase/functions/process-access-request/index.ts`, `database/authentication_details.sql` |
| Dashboard | `frontend/src/pages/Dashboard.tsx`, `backend/app/api/dashboard_routes.py`, `backend/app/services/dashboard_service.py` |
| Profile | `frontend/src/pages/Profile.tsx`, `frontend/src/lib/auth.ts`, `backend/app/api/user_routes.py`, `backend/app/services/profile_service.py` |
| Access control | `frontend/src/pages/AccessControl.tsx`, `frontend/src/context/AccessControlContext.tsx`, `backend/app/api/access_control_routes.py`, `backend/app/services/access_control_service.py` |
| Template gallery and upload | `frontend/src/pages/Templates.tsx`, `backend/app/api/templates_routes.py`, `backend/app/services/template_service.py`, `backend/app/services/templates_service.py` |
| Workspace template state | `backend/app/api/workspace_template.py`, `frontend/src/lib/layoutConfig.ts`, `frontend/src/pages/Templates.tsx`, `frontend/src/pages/Generate.tsx` |
| Student import | `frontend/src/pages/ImportStudents.tsx`, `backend/app/api/import_students.py`, `backend/app/api/generate_routes.py`, `backend/app/services/students_service.py` |
| Certificate generation | `frontend/src/pages/Generate.tsx`, `backend/app/api/generate_certificates.py`, `backend/app/services/generate_service.py`, `backend/app/services/generated_certificate_retention_service.py` |
| Registry | `frontend/src/pages/Registry.tsx`, `backend/app/api/students_ready.py` |
| Public verification | `frontend/src/pages/Verify.tsx`, `frontend/src/pages/VerifyResult.tsx`, `backend/app/api/verify.py`, `backend/app/api/verify_routes.py`, `backend/app/services/verify_service.py` |
| Contact form | `frontend/src/pages/Contact.tsx`, `backend/app/api/contact_routes.py`, `backend/app/services/contact_service.py` |

## 10. Notable Technical Decisions and Quirks

These are important for anyone maintaining the project.

### 10.1 There are some overlapping or legacy paths

Examples:

- `verify.py` and `verify_routes.py` both support verification, but in different ways.
- `generate_routes.py` and `generate_certificates.py` both handle generation-related work.
- `user_service.py` is a placeholder, while `profile_service.py` is the real profile implementation.

This means:

- A new developer should confirm which file is actually used by the frontend before editing older code paths.

### 10.2 `app_users` is the real application identity table

Even though Supabase Auth manages login accounts, application behavior depends heavily on `app_users` and its `metadata` field.

That metadata stores things like:

- profile data
- onboarding completion state
- access control information
- organization identity hints

### 10.3 Some frontend API calls are still hardcoded to localhost

Several frontend files call `http://127.0.0.1:8000` directly instead of using a fully centralized env-driven base URL.

This affects deployment and maintainability.

### 10.4 Generated files are stored locally on the backend

That is easy for development, but production hosting platforms may remove local files.

### 10.5 PDF template preview is optional but code-supported

If users upload a PDF template, `template_service.py` tries to create a PNG preview using `pdf2image`.

That means PDF preview support depends on:

- Python package `pdf2image`
- Poppler installed on the machine

### 10.6 Access control metadata must be merged, not overwritten

This repo stores multiple kinds of state in `app_users.metadata`.

If you overwrite metadata carelessly, you can lose:

- onboarding state
- profile data
- access-control settings

## 11. Environment Variables in Plain English

These are the most important ones conceptually.

| Variable | Meaning |
| --- | --- |
| `VITE_SUPABASE_URL` | Frontend Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Frontend-safe public key |
| `VITE_API_BASE_URL` | Intended frontend backend base URL |
| `SUPABASE_URL` | Backend Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend privileged key |
| `FRONTEND_ORIGINS` or `CORS_ORIGINS` | Which frontend domains may call the backend |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | Email sending settings |
| `APP_LOGIN_URL` | Frontend login URL used in invite/access flows |
| `APP_RESET_PASSWORD_URL` | Password-reset URL used by Edge Function invite flow |
| `PUBLIC_VERIFY_BASE_URL` | Base URL embedded into generated QR verification links |
| `API_BASE_URL` | Backend public base URL used for generated download links |

## 12. How the Frontend and Backend Talk to Each Other

In simple terms:

1. Frontend gets a Supabase access token after login.
2. Frontend calls backend endpoints with `fetch` or `axios`.
3. Backend validates the token.
4. Backend reads/writes Supabase tables or storage.
5. Backend returns JSON to the frontend.

Common endpoints used by the frontend include:

- `/dashboard/stats`
- `/dashboard/activity`
- `/user/profile`
- `/api/access-control/overview`
- `/api/access-control/invite`
- `/api/templates/`
- `/api/templates/upload`
- `/api/workspace-template`
- `/api/generate/preview`
- `/api/import-students/save`
- `/api/students-ready`
- `/api/generate-certificates`
- `/api/my-certificates`
- `/api/contact`
- `/verify/:certId`

## 13. If You Are New and Want to Understand the Code Fast

Read in this order:

1. `README.md`
2. `Guide.md`
3. `frontend/src/App.tsx`
4. `frontend/src/lib/auth.ts`
5. `backend/app/main.py`
6. `backend/app/api/user_routes.py`
7. `backend/app/api/templates_routes.py`
8. `backend/app/api/import_students.py`
9. `backend/app/api/generate_certificates.py`
10. `backend/app/services/access_control_service.py`

That order helps because it moves from general app structure to auth, then core feature flows.

## 14. Final Summary

CertifyPro is not just a frontend website and not just a backend API.

It is a combined system with:

- a public-facing landing and marketing site
- an authenticated admin workspace
- Supabase-based auth and data storage
- document-backed access approval logic
- certificate template management
- student import and validation
- certificate image generation
- public certificate verification
- role-based access control

The most important mental model is this:

1. Supabase owns identity, storage, and the main data tables.
2. FastAPI is the business layer that validates, transforms, generates, and secures app operations.
3. React is the user experience layer that calls those operations.
4. `app_users.metadata` is a central place where profile and access state are stored.

If you understand those four ideas, most of the repository becomes much easier to follow.