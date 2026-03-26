# Access Control Manual Setup

This implementation does not add a new database table. It stores access-control state inside `public.app_users.metadata.access_control` so it can work with the current auth flow.

## Fixed Rules

1. Super admin is always:
   - Name: `CERTIFYPRO`
   - Email: `certifyprocare@gmail.com`
2. Any signed-in non-super-admin account is treated as an admin by default unless that account was explicitly invited as a co-admin.
3. Admins can invite and remove only co-admins.
4. Super admin can invite/remove admins and co-admins.
5. Co-admins get only the component permissions assigned to them.

## Run Queries One By One

### 1. Check the current `app_users` structure

```sql
select column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name = 'app_users'
order by ordinal_position;
```

### 2. Verify the reserved super-admin row

```sql
select id, auth_uid, email, role, full_name, metadata
from public.app_users
where lower(email) = 'certifyprocare@gmail.com';
```

### 3. If the reserved super-admin row does not exist, create it

```sql
insert into public.app_users (email, role, full_name, metadata)
values (
  'certifyprocare@gmail.com',
  'super_admin',
  'CERTIFYPRO',
  jsonb_build_object(
    'access_control',
    jsonb_build_object(
      'member_type', 'super_admin',
      'status', 'active',
      'permissions', jsonb_build_array('dashboard', 'templates', 'import_students', 'generate', 'registry', 'access_control'),
      'created_at', now(),
      'updated_at', now()
    )
  )
)
on conflict do nothing;
```

### 4. Normalize the reserved super-admin row if it already exists

```sql
update public.app_users
set role = 'super_admin',
    full_name = 'CERTIFYPRO',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'access_control',
      jsonb_build_object(
        'member_type', 'super_admin',
        'status', 'active',
        'permissions', jsonb_build_array('dashboard', 'templates', 'import_students', 'generate', 'registry', 'access_control'),
        'updated_at', now()
      )
    )
where lower(email) = 'certifyprocare@gmail.com';
```

### 5. Review all current access-control entries

```sql
select
  id,
  email,
  role,
  full_name,
  metadata -> 'access_control' as access_control
from public.app_users
where metadata ? 'access_control'
order by lower(email);
```

### 6. Convert an existing account into a co-admin manually

```sql
update public.app_users
set role = 'admin',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'access_control',
      jsonb_build_object(
        'member_type', 'co_admin',
        'status', 'active',
        'permissions', jsonb_build_array('dashboard', 'registry'),
        'updated_at', now()
      )
    )
where lower(email) = lower('replace-with-user-email@example.com');
```

### 7. Remove a member manually

```sql
update public.app_users
set role = 'user',
    metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
      'access_control',
      jsonb_build_object(
        'member_type', 'co_admin',
        'status', 'removed',
        'permissions', jsonb_build_array(),
        'updated_at', now(),
        'removed_at', now()
      )
    )
where lower(email) = lower('replace-with-user-email@example.com');
```

    ### 8. Set the super-admin password in Supabase Auth

    The password is not stored in `public.app_users`. This app signs in through Supabase Auth using email/password, so set the password on the auth user for `certifyprocare@gmail.com`.

    Use the Supabase dashboard:

    1. Open `Authentication`.
    2. Open `Users`.
    3. Find `certifyprocare@gmail.com`.
    4. Use the password reset or user edit flow.
    5. Set the password to `*5589*0085*h*#`.

    If you are using SQL-only workflows, keep the password out of repository files and out of `app_users.metadata`.

  ### 9. Enable co-admin invite emails in Supabase Auth

  The invite button now sends email through `supabase.auth.admin.invite_user_by_email(...)` from the backend.

  Manual configuration required:

  1. In the backend `.env`, confirm these values exist:
    - `SUPABASE_URL`
    - `SUPABASE_SERVICE_ROLE_KEY`
    - `FRONTEND_ORIGINS=http://localhost:8080,http://127.0.0.1:8080`
    - Optional: `ACCESS_INVITE_REDIRECT_URL=http://localhost:8080/reset-password?type=invite`
  2. In Supabase dashboard, open `Authentication` -> `URL Configuration`.
  3. Set `Site URL` to your frontend base URL.
    - Local example: `http://localhost:8080`
  4. Add the reset page to redirect URLs.
    - Local example: `http://localhost:8080/reset-password`
  5. In `Authentication` -> `Providers` / email settings, keep email auth enabled.
  6. In `Authentication` -> email template settings, verify invite emails are enabled.
  7. If you use custom SMTP, configure it there; otherwise Supabase default delivery must remain active.
  8. Restart the backend after changing `.env` values.

  What happens after invite:

  1. Admin or super-admin clicks `Invite Co-Admin`.
  2. Backend stores the pending access rule in `app_users.metadata.access_control`.
  3. Backend sends a Supabase Auth invite email.
  4. The invite link opens `/reset-password?type=invite`.
  5. The invited user sets a password and can then sign in.
  6. On first authenticated load, the pending co-admin record is linked to the real auth user id.

## Logic Applied In Code

1. Backend route: `GET /api/access-control/overview`
   - Ensures the signed-in account has an `app_users` row.
   - Forces `certifyprocare@gmail.com` to super-admin.
   - Returns the current actor, all active/invited members, and the permission catalog.

2. Backend route: `POST /api/access-control/invite`
   - Super admin can invite admins or co-admins.
   - Admin can invite only co-admins.
  - Co-admin permissions are stored in `metadata.access_control.permissions`.
  - If the invited person does not already have a linked auth account, the backend sends a Supabase invitation email.

3. Backend route: `PATCH /api/access-control/members/{id}/permissions`
   - Updates co-admin module access only.

4. Backend route: `DELETE /api/access-control/members/{id}`
   - Soft-removes the member by setting `metadata.access_control.status = 'removed'` and downgrading `role` to `user`.

5. Frontend behavior
   - Navigation shows only pages the current actor can access.
   - Route-level guard prevents direct URL access to blocked modules.
   - Access Control page is live and backed by the API.

6. Safety fix
   - `profile_service.mark_first_login_complete()` now merges metadata instead of overwriting it, so access-control data survives onboarding updates.
7. Password handling
  - Super-admin password belongs to Supabase Auth, not to `app_users` or access-control metadata.
8. Invite handling
  - Invite emails depend on Supabase Auth email delivery and redirect URL configuration.