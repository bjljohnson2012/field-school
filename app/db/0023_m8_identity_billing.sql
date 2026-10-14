-- M8 identity and billing. Idempotent. No backfill. No charges.
-- 0005_coaching.sql owns coaching_plans as per-membership plans (no tier column).
-- Seed tiers only when this file's table shape is present. Otherwise 0024 stores
-- the same tiers in m8_offer_tiers.

CREATE TABLE IF NOT EXISTS coaching_plans (
  tier text PRIMARY KEY CHECK (tier IN ('assess', 'model', 'build', 'individual')),
  monthly_usd integer,
  sessions_per_month integer NOT NULL DEFAULT 0,
  lookup_key text,
  published boolean NOT NULL DEFAULT false
);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'coaching_plans'
      AND column_name = 'tier'
  ) THEN
    INSERT INTO coaching_plans (tier, monthly_usd, sessions_per_month, lookup_key, published)
    VALUES
      ('assess', 300, 1, 'coaching_assess_monthly', true),
      ('model', 600, 2, 'coaching_model_monthly', true),
      ('build', 1500, 4, 'coaching_build_monthly', true),
      ('individual', 10, 0, NULL, false)
    ON CONFLICT (tier) DO NOTHING;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS coaching_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  tier text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('recap', 'next_steps', 'model_update', 'quarterly_review')),
  status text NOT NULL CHECK (status IN ('draft', 'published')),
  body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coaching_records_org_idx
  ON coaching_records (org_id, status, kind);

CREATE TABLE IF NOT EXISTS auth_session_revocations (
  jti text PRIMARY KEY,
  member_id uuid REFERENCES members(id),
  revoked_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_form_submissions (
  id text PRIMARY KEY,
  kind text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
