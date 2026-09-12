-- Household + sales tenants, invites, skill_states.
-- Do not rename Wave 1 assignments. Do not write leftover TanStack db.

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS host text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS features jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE members ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'adult';
ALTER TABLE members ADD COLUMN IF NOT EXISTS auth_user_id text;
ALTER TABLE member_profiles ADD COLUMN IF NOT EXISTS evidence_summary text;

CREATE UNIQUE INDEX IF NOT EXISTS organizations_host_idx
  ON organizations (host) WHERE host IS NOT NULL;

INSERT INTO organizations (slug, name, kind, isolation, features)
VALUES
  ('sales', 'Sales team', 'company', 'platform_plus', '{"cap": false}'::jsonb)
ON CONFLICT (slug) DO UPDATE
  SET kind = EXCLUDED.kind,
      isolation = EXCLUDED.isolation;

UPDATE organizations
SET features = coalesce(features, '{}'::jsonb) || '{"cap": false}'::jsonb
WHERE slug = 'household';

UPDATE organizations
SET kind = 'homeschool', isolation = 'strict'
WHERE slug = 'household';

CREATE TABLE IF NOT EXISTS invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  email text NOT NULL,
  stance text NOT NULL DEFAULT 'learner',
  token text NOT NULL UNIQUE,
  invited_by_membership_id uuid REFERENCES memberships(id),
  status text NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS invites_org_email_idx ON invites (org_id, email);

CREATE TABLE IF NOT EXISTS skill_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  score numeric,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, membership_id, skill_id)
);

CREATE TABLE IF NOT EXISTS skill_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
