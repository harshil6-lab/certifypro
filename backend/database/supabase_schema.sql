-- Supabase schema for CertifyPro
-- Run this in the Supabase SQL editor to create application tables and helpful views
-- NOTES:
-- 1. Supabase handles authentication in the 'auth' schema (auth.users). We
--    keep an application-level `users` table for roles and app metadata and
--    store `auth_uid` to link to auth.users.
-- 2. Do NOT insert or expose the service_role key to the frontend.

-- Enable pgcrypto extension for gen_random_uuid() on Postgres (Supabase)
create extension if not exists pgcrypto;

-- ORGANIZATIONS: canonical registry with unique organization name and key
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization_key text not null,
  created_at timestamptz default now()
);

create unique index if not exists idx_organizations_name_lower_unique
on organizations (lower(name));

create unique index if not exists idx_organizations_key_unique
on organizations (organization_key);

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

create table if not exists generated_certificates (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  template_id uuid references templates(id) on delete set null,
  created_by uuid references app_users(id) on delete set null,
  certificate_id text,
  student_name text,
  file_url text not null,
  verification_url text,
  created_at timestamptz default now()
);

create table if not exists workspace_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  template_id uuid references templates(id) on delete cascade,
  custom_template_url text,
  layout_config jsonb default '{}'::jsonb,
  is_active boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
create index if not exists idx_generated_certificates_student on generated_certificates(student_id);
create index if not exists idx_generated_certificates_created_by on generated_certificates(created_by);
create index if not exists idx_workspace_templates_user on workspace_templates(user_id);
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

-- SUBSCRIPTIONS: user subscription and credit tracking
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete cascade,
  plan text not null default 'free', -- 'free' | 'pro'
  plan_selected boolean default false,
  credits_used integer default 0,
  credits_limit integer default 12, -- null for unlimited (pro)
  razorpay_payment_id text,
  razorpay_subscription_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- PAYMENT_ORDERS: audit trail for Razorpay orders
create table if not exists payment_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references app_users(id) on delete cascade,
  razorpay_order_id text not null,
  amount integer not null, -- in paise
  currency text not null default 'INR',
  status text not null default 'created', -- 'created' | 'paid' | 'failed'
  razorpay_payment_id text,
  razorpay_signature text,
  created_at timestamptz default now()
);

-- INDEXES for subscriptions and payment_orders
create index if not exists idx_subscriptions_user on subscriptions(user_id);
create index if not exists idx_payment_orders_user on payment_orders(user_id);
create index if not exists idx_payment_orders_razorpay_order on payment_orders(razorpay_order_id);

-- TRIGGER: auto-create subscription on new user
create or replace function create_subscription_on_user()
returns trigger language plpgsql as $$
begin
  insert into subscriptions (user_id, plan, plan_selected, credits_used, credits_limit)
    values (new.id, 'free', false, 0, 12);
  return new;
end;
$$;

drop trigger if exists tr_create_subscription_on_user on app_users;
create trigger tr_create_subscription_on_user
  after insert on app_users
  for each row execute function create_subscription_on_user();

-- FUNCTION: backfill subscriptions for existing users
create or replace function backfill_subscriptions()
returns void language plpgsql as $$
declare
  user_rec record;
begin
  for user_rec in select id from app_users loop
    insert into subscriptions (user_id, plan, plan_selected, credits_used, credits_limit)
      values (user_rec.id, 'free', false, 0, 12)
      on conflict (user_id) do nothing;
  end loop;
end;
$$;

-- Run backfill once (can be called manually if needed)
-- select backfill_subscriptions();

-- End of schema file