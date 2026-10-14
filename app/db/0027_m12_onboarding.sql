-- M12 onboarding flow state. Idempotent. Does not claim 0026.
-- Does not change organizations.kind. homeschool stays a valid kind.

CREATE TABLE IF NOT EXISTS onboarding_flows (
  member_id uuid PRIMARY KEY REFERENCES members(id) ON DELETE CASCADE,
  org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  inviting_org_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  membership_id uuid REFERENCES memberships(id) ON DELETE SET NULL,
  entry text NOT NULL CHECK (entry IN ('signup', 'invite')),
  step_id text NOT NULL,
  brain_named boolean NOT NULL DEFAULT false,
  brain_name text NOT NULL DEFAULT '',
  room text,
  org_name text NOT NULL DEFAULT '',
  homeschool_mode boolean,
  people jsonb NOT NULL DEFAULT '[]'::jsonb,
  adult_gates jsonb NOT NULL DEFAULT '{}'::jsonb,
  kid_intake_done boolean NOT NULL DEFAULT false,
  aim text NOT NULL DEFAULT '',
  outcome_id uuid,
  campus_ready boolean NOT NULL DEFAULT false,
  profile_done boolean NOT NULL DEFAULT false,
  created_org_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS org_id uuid;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS inviting_org_id uuid;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS membership_id uuid;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS entry text;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS step_id text;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS brain_named boolean NOT NULL DEFAULT false;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS brain_name text NOT NULL DEFAULT '';
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS room text;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS org_name text NOT NULL DEFAULT '';
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS homeschool_mode boolean;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS people jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS adult_gates jsonb NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS kid_intake_done boolean NOT NULL DEFAULT false;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS aim text NOT NULL DEFAULT '';
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS outcome_id uuid;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS campus_ready boolean NOT NULL DEFAULT false;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS profile_done boolean NOT NULL DEFAULT false;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS created_org_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS events jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE onboarding_flows ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS onboarding_flows_org_idx ON onboarding_flows (org_id);
