-- Profile M1. One adult profile per User (members.id). Kid profile is a subject under the parent User.
-- No public share column. No resume, LinkedIn, or nudge column. Kid row has no photo column.
-- Does not alter 0001-0016.
CREATE TABLE IF NOT EXISTS user_profiles (
  member_id uuid PRIMARY KEY REFERENCES members(id),
  display_name text NOT NULL DEFAULT '',
  photo_url text NOT NULL DEFAULT '',
  current_projects jsonb NOT NULL DEFAULT '[]'::jsonb,
  skills_adapted jsonb NOT NULL DEFAULT '[]'::jsonb,
  gates jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS kid_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  child_membership_id uuid NOT NULL REFERENCES memberships(id),
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  display_name text NOT NULL DEFAULT '',
  intake_done_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT kid_profiles_child UNIQUE (org_id, child_membership_id)
);

CREATE INDEX IF NOT EXISTS kid_profiles_parent_idx
  ON kid_profiles (org_id, parent_membership_id);
