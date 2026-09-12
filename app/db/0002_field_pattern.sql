-- Field Pattern (fp-50-v1): item table, live profile, append-only revisions.
-- Skills stay org-scoped. Chooser reads the profile; it does not write packs.

CREATE TABLE IF NOT EXISTS instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  version text NOT NULL,
  likert_min integer NOT NULL DEFAULT 1,
  likert_max integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instrument_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  item_key text NOT NULL,
  prompt text NOT NULL,
  correspondence text NOT NULL,
  reverse_scored boolean NOT NULL DEFAULT false,
  child_subset boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (instrument_id, item_key)
);

CREATE TABLE IF NOT EXISTS wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  guardian_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid NOT NULL REFERENCES memberships(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, guardian_membership_id, child_membership_id)
);

CREATE TABLE IF NOT EXISTS member_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  instrument_slug text NOT NULL DEFAULT 'fp-50-v1',
  bearing_deg numeric NOT NULL DEFAULT 0,
  bearing_primary text,
  bearing_secondary text,
  correspondence jsonb NOT NULL DEFAULT '{}'::jsonb,
  narratives jsonb NOT NULL DEFAULT '{}'::jsonb,
  locked boolean NOT NULL DEFAULT false,
  locked_by_membership_id uuid REFERENCES memberships(id),
  locked_at timestamptz,
  last_run_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, membership_id)
);

CREATE TABLE IF NOT EXISTS member_profile_revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES member_profiles(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  cause text NOT NULL,
  bearing_deg numeric NOT NULL,
  correspondence jsonb NOT NULL,
  narratives jsonb NOT NULL,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS instrument_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  instrument_slug text NOT NULL,
  subset text NOT NULL,
  answers jsonb NOT NULL,
  correspondence jsonb NOT NULL,
  bearing_deg numeric NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  kind text NOT NULL,
  transcript text NOT NULL DEFAULT '',
  inferred jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  slug text NOT NULL,
  name text NOT NULL,
  rubric jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS skill_observations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  skill_id uuid NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  artifact_id uuid REFERENCES profile_artifacts(id),
  score numeric,
  evidence text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS instrument_items_instrument_idx
  ON instrument_items (instrument_id, sort_order);
CREATE INDEX IF NOT EXISTS member_profiles_membership_idx
  ON member_profiles (org_id, membership_id);
CREATE INDEX IF NOT EXISTS member_profile_revisions_profile_idx
  ON member_profile_revisions (profile_id, created_at);
CREATE INDEX IF NOT EXISTS wards_child_idx
  ON wards (org_id, child_membership_id);
CREATE INDEX IF NOT EXISTS skills_org_idx
  ON skills (org_id, slug);
CREATE INDEX IF NOT EXISTS skill_observations_membership_idx
  ON skill_observations (org_id, membership_id, skill_id);
