-- FR-4 child-bound curriculum paths.
-- Composer 0005 stays org authoring. Assigned path is this store.
-- Every path and every item has child_membership_id. Child ≠ User.
-- Optional composer_lesson_id / composer_unit_id are catalog refs, not the bind.
-- Idempotent. Do not write leftover TanStack db. Do not alter 0001-0005.

CREATE TABLE IF NOT EXISTS curriculum_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid NOT NULL REFERENCES memberships(id),
  intent_id uuid REFERENCES learning_intents(id),
  version integer NOT NULL,
  status text NOT NULL DEFAULT 'proposed',
  prompt text NOT NULL DEFAULT '',
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  supersedes_id uuid REFERENCES curriculum_paths(id),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, child_membership_id, version)
);

CREATE TABLE IF NOT EXISTS curriculum_path_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  path_id uuid NOT NULL REFERENCES curriculum_paths(id) ON DELETE CASCADE,
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid NOT NULL REFERENCES memberships(id),
  sort_order integer NOT NULL,
  title text NOT NULL,
  subject text NOT NULL DEFAULT '',
  kind text NOT NULL DEFAULT 'station',
  reason text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'intent',
  composer_lesson_id uuid,
  composer_unit_id uuid,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (path_id, sort_order)
);

CREATE INDEX IF NOT EXISTS curriculum_paths_child_idx
  ON curriculum_paths (org_id, child_membership_id, version DESC);

CREATE INDEX IF NOT EXISTS curriculum_paths_parent_child_idx
  ON curriculum_paths (org_id, parent_membership_id, child_membership_id, version DESC);

CREATE INDEX IF NOT EXISTS curriculum_path_items_child_idx
  ON curriculum_path_items (org_id, child_membership_id, path_id, sort_order);

CREATE INDEX IF NOT EXISTS curriculum_path_items_catalog_idx
  ON curriculum_path_items (org_id, child_membership_id, composer_lesson_id);
