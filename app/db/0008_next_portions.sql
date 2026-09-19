-- FR-5 next-portion planning bound to Child.
-- Remaining accepted path + child progress + parent intent.
-- Parent lock or override. Child ≠ User. No fourth SKU.
-- Not GET /api/chooser Pattern next-station.
-- Idempotent. Do not write leftover TanStack db. Do not alter 0001-0007.

CREATE TABLE IF NOT EXISTS next_portions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid NOT NULL REFERENCES memberships(id),
  path_id uuid REFERENCES curriculum_paths(id),
  intent_id uuid REFERENCES learning_intents(id),
  version integer NOT NULL,
  status text NOT NULL DEFAULT 'suggested',
  horizon text NOT NULL DEFAULT 'week',
  title text NOT NULL,
  reason text NOT NULL DEFAULT '',
  remaining jsonb NOT NULL DEFAULT '{}'::jsonb,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  supersedes_id uuid REFERENCES next_portions(id),
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, child_membership_id, version)
);

CREATE TABLE IF NOT EXISTS next_portion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  portion_id uuid NOT NULL REFERENCES next_portions(id) ON DELETE CASCADE,
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid NOT NULL REFERENCES memberships(id),
  path_item_id uuid,
  sort_order integer NOT NULL,
  title text NOT NULL,
  subject text NOT NULL DEFAULT '',
  reason text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'remaining',
  composer_lesson_id uuid,
  composer_unit_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (portion_id, sort_order)
);

CREATE INDEX IF NOT EXISTS next_portions_child_idx
  ON next_portions (org_id, child_membership_id, version DESC);

CREATE INDEX IF NOT EXISTS next_portions_parent_child_idx
  ON next_portions (org_id, parent_membership_id, child_membership_id, version DESC);

CREATE INDEX IF NOT EXISTS next_portion_items_child_idx
  ON next_portion_items (org_id, child_membership_id, portion_id, sort_order);
