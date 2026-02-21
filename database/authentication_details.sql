create extension if not exists "uuid-ossp";

create table if not exists public.access_requests (
  id uuid primary key default uuid_generate_v4(),
  full_name text not null,
  email text not null,
  organization text not null,
  linkedin_url text,
  org_document_url text,
  reason_for_access text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'hold', 'rejected')),
  score int not null default 0,
  validation_notes text,
  approved_user_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_access_requests_email on public.access_requests(email);
create index if not exists idx_access_requests_status on public.access_requests(status);

create or replace function public.set_access_request_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_access_requests_updated_at on public.access_requests;
create trigger trg_access_requests_updated_at
before update on public.access_requests
for each row execute function public.set_access_request_updated_at();

alter table public.access_requests enable row level security;

drop policy if exists "anon_insert_access_requests" on public.access_requests;
create policy "anon_insert_access_requests"
on public.access_requests
for insert
to anon, authenticated
with check (true);

drop policy if exists "anon_select_access_requests" on public.access_requests;
create policy "anon_select_access_requests"
on public.access_requests
for select
to anon, authenticated
using (true);

drop policy if exists "service_role_update_access_requests" on public.access_requests;
create policy "service_role_update_access_requests"
on public.access_requests
for update
to service_role
using (true)
with check (true);

insert into storage.buckets (id, name, public)
values ('org-documents', 'org-documents', false)
on conflict (id) do nothing;

drop policy if exists "anon_upload_org_documents" on storage.objects;
create policy "anon_upload_org_documents"
on storage.objects
for insert
to anon, authenticated
with check (bucket_id = 'org-documents');

drop policy if exists "service_role_read_org_documents" on storage.objects;
create policy "service_role_read_org_documents"
on storage.objects
for select
to service_role
using (bucket_id = 'org-documents');

drop policy if exists "service_role_modify_org_documents" on storage.objects;
create policy "service_role_modify_org_documents"
on storage.objects
for update
to service_role
using (bucket_id = 'org-documents')
with check (bucket_id = 'org-documents');