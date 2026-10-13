-- M8 offer tiers. Additive. Does not change the existing org plan table.
-- 0023 tried to store tiers in that table, so the insert did not apply and
-- the later tables were not created. This file creates the missing objects.

CREATE TABLE IF NOT EXISTS m8_offer_tiers (
  tier text PRIMARY KEY CHECK (tier IN ('assess', 'model', 'build', 'individual')),
  monthly_usd integer,
  sessions_per_month integer NOT NULL DEFAULT 0,
  lookup_key text,
  published boolean NOT NULL DEFAULT false
);

INSERT INTO m8_offer_tiers (tier, monthly_usd, sessions_per_month, lookup_key, published)
VALUES
  ('assess', 300, 1, 'coaching_assess_monthly', true),
  ('model', 600, 2, 'coaching_model_monthly', true),
  ('build', 1500, 4, 'coaching_build_monthly', true),
  ('individual', 10, 0, NULL, false)
ON CONFLICT (tier) DO NOTHING;

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
