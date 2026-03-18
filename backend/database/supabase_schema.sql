-- Supabase schema for CertifyPro
-- Run this in the Supabase SQL editor to create application tables and helpful views
-- NOTES:
-- 1. Supabase handles authentication in the 'auth' schema (auth.users). We
--    keep an application-level `users` table for roles and app metadata and
--    store `auth_uid` to link to auth.users.
-- 2. Do NOT insert or expose the service_role key to the frontend.

-- Enable pgcrypto extension for gen_random_uuid() on Postgres (Supabase)
create extension if not exists pgcrypto;

-- USERS: application user metadata separate from Supabase auth
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  auth_uid uuid references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user', -- 'admin' | 'user'
  full_name text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- TEMPLATES: certificate templates (official + custom)
create table if not exists templates (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  title text not null,
  category text,
  description text,
  image_url text,
  style_type text,
  editable_fields jsonb default '[]'::jsonb,
  is_official boolean default false,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- STUDENTS: imported students for generation
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  email text,
  full_name text,
  external_id text, -- optional id from upstream (csv, SIS)
  metadata jsonb default '{}'::jsonb,
  created_by uuid references app_users(id) on delete set null,
  created_at timestamptz default now()
);

-- CERTIFICATES: generated certificate records
create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  template_id uuid references templates(id) on delete set null,
  student_id uuid references students(id) on delete set null,
  issuer_id uuid references app_users(id) on delete set null,
  data jsonb default '{}'::jsonb, -- serialized fields placed into certificate (recipient, title...)
  qr_token text unique, -- short secret/token encoded in QR to verify
  qr_url text, -- optional absolute url for QR pointing to verification endpoint
  status text default 'issued', -- 'issued' | 'revoked'
  created_at timestamptz default now(),
  issued_at timestamptz default now()
);

-- ACTIVITY LOG: for dashboard recent activity
create table if not exists activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete set null,
  action text not null,
  meta jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- INDEXES to speed up common queries
create index if not exists idx_templates_category on templates(category);
create index if not exists idx_students_email on students(email);
create index if not exists idx_certificates_qr_token on certificates(qr_token);
create index if not exists idx_certificates_student on certificates(student_id);
create index if not exists idx_activities_user on activities(user_id);

-- VIEW: dashboard_stats (counts)
create or replace view dashboard_stats as
select
  (select count(*) from templates) as templates_count,
  (select count(*) from students) as students_count,
  (select count(*) from certificates where status = 'issued') as certificates_count,
  (select count(*) from certificates where status = 'revoked') as revoked_count;

-- FUNCTION: create_certificate(template_id, student_id, issuer_id, payload json)
-- This function inserts a certificate, generates a random qr_token and qr_url.
create or replace function create_certificate(template_uuid uuid, student_uuid uuid, issuer_uuid uuid, payload jsonb)
returns uuid language plpgsql as $$
declare
  cert_id uuid;
  token text;
  base_url text := current_setting('app.verify_base_url', true);
begin
  insert into certificates(template_id, student_id, issuer_id, data)
    values (template_uuid, student_uuid, issuer_uuid, payload)
    returning id into cert_id;

  -- generate a secure token (random 22-char base62) using gen_random_bytes
  token := encode(gen_random_bytes(12), 'base64');
  -- make token URL-safe: replace +/ and trim =
  token := regexp_replace(token, '[+/=]', '', 'g');

  update certificates set qr_token = token where id = cert_id;

  -- If an application-level verify base URL is set, set qr_url
  if base_url is not null then
    update certificates set qr_url = base_url || '/verify/' || cert_id::text where id = cert_id;
  end if;

  -- record activity
  insert into activities(user_id, action, meta) values (issuer_uuid, 'certificate.created', jsonb_build_object('certificate_id', cert_id));

  return cert_id;
end;
$$;

-- SECURITY & RLS notes (recommended):
-- 1. Enable Row Level Security (RLS) on tables and create policies that allow
--    only authenticated users to insert/select, and owners to modify their
--    own data. Example policies are intentionally omitted here because your
--    team needs to review role mappings (app_users.auth_uid) and decide the
--    exact rules. Consider granting admins broader access via role checks.

-- Helpful function: verify_certificate_by_token
create or replace function verify_certificate_by_token(token_text text)
returns jsonb language sql as $$
  select jsonb_build_object(
    'valid', case when c.id is not null and c.status = 'issued' then true else false end,
    'certificate', to_jsonb(c.*) - 'data' || jsonb_build_object('data', c.data)
  )
  from certificates c where c.qr_token = token_text limit 1;
$$;

-- Provide convenience view for public verification by id (non-secret)
create or replace view public_certificate_info as
select id, template_id, student_id, issuer_id, data, status, issued_at from certificates;

-- End of schema file
