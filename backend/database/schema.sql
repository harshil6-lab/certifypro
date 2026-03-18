-- Database schema for CertifyPro (minimal users table)
-- Purpose: store user metadata for dashboard and role checks

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL DEFAULT 'user', -- 'admin' | 'user'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notes:
-- - Keep user-sensitive auth in Supabase; this table stores application
--   specific metadata such as role and institutions.
