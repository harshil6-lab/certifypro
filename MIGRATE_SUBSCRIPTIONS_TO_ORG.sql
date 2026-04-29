-- MIGRATE_SUBSCRIPTIONS_TO_ORG.sql
-- Run this in Supabase SQL Editor after updating schema to migrate existing data
-- Safe, no data loss. Assumes app_users.metadata has organization_id

BEGIN;

-- 1. Add columns (already in schema.sql - idempotent)
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE payment_orders ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

-- 2. Backfill organization_id from app_users.metadata
UPDATE subscriptions s
SET organization_id = au.metadata->'access_control'->>'organization_id'::uuid
FROM app_users au 
WHERE s.user_id = au.id 
  AND au.metadata ? 'access_control'
  AND au.metadata->'access_control' ? 'organization_id';

UPDATE payment_orders po
SET organization_id = au.metadata->'access_control'->>'organization_id'::uuid
FROM app_users au 
WHERE po.user_id = au.id 
  AND au.metadata ? 'access_control'
  AND au.metadata->'access_control' ? 'organization_id';

-- 3. Drop old user_id unique constraint if exists, add organization_id unique
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_user_id_key;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_org_id_key UNIQUE (organization_id);

-- 4. Drop user trigger
DROP TRIGGER IF EXISTS tr_create_subscription_on_user ON app_users;
DROP FUNCTION IF EXISTS create_subscription_on_user();

-- 5. Create org trigger
CREATE OR REPLACE FUNCTION create_subscription_on_org()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO subscriptions (organization_id, plan, plan_selected, credits_used, credits_limit)
  VALUES (NEW.id, 'free', false, 0, 12)
  ON CONFLICT (organization_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_create_subscription_on_org
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION create_subscription_on_org();

COMMIT;

-- Verify
SELECT 'Subscriptions by org' as check, count(*) FROM subscriptions GROUP BY organization_id;
SELECT 'Payment orders by org' as check, count(*) FROM payment_orders GROUP BY organization_id;

