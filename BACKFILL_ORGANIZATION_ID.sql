-- Backfill organization_id for existing students from metadata
-- Run this in Supabase SQL Editor AFTER running supabase_schema.sql
-- Safe: only updates where metadata has valid organization_id

UPDATE students 
SET organization_id = (metadata->>'organization_id')::uuid 
WHERE metadata ? 'organization_id' 
  AND (metadata->>'organization_id') ~ '^[0-9a-fA-F-]{36}$'
  AND NOT EXISTS (SELECT 1 FROM organizations WHERE id = (metadata->>'organization_id')::uuid);

-- Verify:
-- SELECT organization_id, metadata->>'organization_id' as old_meta_id, count(*) FROM students GROUP BY 1,2;

