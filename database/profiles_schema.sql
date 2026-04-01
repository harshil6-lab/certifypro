-- Profiles Table - Links Supabase Auth users to application roles and organization
-- This table stores application-level metadata separate from auth system

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  organization text,
  role text not null default 'staff' check (role in ('staff', 'admin', 'super_admin')),
  first_login_required boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger to update updated_at timestamp
create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_profiles_updated_at();

-- Enable RLS
alter table public.profiles enable row level security;

-- Policy: Users can read only their own profile
drop policy if exists "users_read_own_profile" on public.profiles;
create policy "users_read_own_profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

-- Policy: Users can update only their own profile (limited fields)
drop policy if exists "users_update_own_profile" on public.profiles;
create policy "users_update_own_profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Policy: Service role can insert (for admin operations)
drop policy if exists "service_insert_profiles" on public.profiles;
create policy "service_insert_profiles"
on public.profiles
for insert
to service_role
with check (true);

-- Create index for faster lookups
create index if not exists idx_profiles_email on public.profiles(email);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_organization on public.profiles(organization);

-- Add comment
comment on table public.profiles is 'Application-level user profiles linked to Supabase Auth users';
comment on column public.profiles.id is 'Foreign key to auth.users(id)';
comment on column public.profiles.email is 'User email (denormalized from auth)';
comment on column public.profiles.organization is 'Organization/tenant name';
comment on column public.profiles.role is 'Application role (staff, admin, super_admin)';
comment on column public.profiles.first_login_required is 'Flag to redirect to profile completion on first login';
