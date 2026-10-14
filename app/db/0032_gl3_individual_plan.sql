-- GL3 hidden Individual learning plan. Idempotent. Does not alter 0031.
-- Org kinds stay as they are. Living-brain tables stay.
-- Credit numbers stay in app config and are read at runtime.

CREATE TABLE IF NOT EXISTS learning_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id),
  owner_membership_id uuid NOT NULL REFERENCES memberships(id),
  kind text NOT NULL DEFAULT 'individual' CHECK (kind = 'individual'),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  outcome_id uuid REFERENCES outcomes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_plans_owner_idx
  ON learning_plans (org_id, owner_membership_id, status);

CREATE INDEX IF NOT EXISTS learning_plans_outcome_idx
  ON learning_plans (outcome_id);

CREATE TABLE IF NOT EXISTS plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_plan_id uuid NOT NULL REFERENCES learning_plans(id) ON DELETE CASCADE,
  position integer NOT NULL CHECK (position >= 0),
  label text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('knowledge', 'skill', 'demonstration')),
  outcome_requirement_id uuid REFERENCES outcome_requirements(id) ON DELETE SET NULL,
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  supersedes uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS plan_items_version_order
  ON plan_items (learning_plan_id, version, position);

CREATE INDEX IF NOT EXISTS plan_items_plan_idx
  ON plan_items (learning_plan_id, version, position);
