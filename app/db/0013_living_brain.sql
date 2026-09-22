-- Org brain: facts for the org, profile and outcomes for each person.
-- Home child has no login. Sales team member may sign in. The accountable person owns outcomes.
-- Does not alter knowledge_brains. Does not alter 0001-0012.

CREATE TABLE IF NOT EXISTS living_brains (
  org_id uuid PRIMARY KEY REFERENCES organizations(id),
  room text NOT NULL,
  facts text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS living_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  name text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT '',
  login text NOT NULL,
  profile text NOT NULL DEFAULT '',
  outcomes text NOT NULL DEFAULT '',
  owns_outcomes boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, membership_id)
);

CREATE INDEX IF NOT EXISTS living_profiles_org_idx
  ON living_profiles (org_id, membership_id);
