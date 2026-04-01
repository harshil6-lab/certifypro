-- Database schema for CertifyPro (minimal users table)
-- Purpose: store user metadata for dashboard and role checks

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin' | 'user'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organization_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_name_lower_unique
ON organizations (lower(name));

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_key_unique
ON organizations (organization_key);

-- Notes:
-- - Keep user-sensitive auth in Supabase; this table stores application
--   specific metadata such as role and institutions.
