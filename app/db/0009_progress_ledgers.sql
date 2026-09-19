-- FR-6 parent-supervised playback + FR-2 child-bound unit ledger.
-- Parent writes. Child ≠ User. Not actor session progress. Not Pattern chooser.
-- Idempotent. Do not write leftover TanStack db. Do not alter 0001-0008.

CREATE TABLE IF NOT EXISTS progress_ledgers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid NOT NULL REFERENCES memberships(id),
  path_id uuid REFERENCES curriculum_paths(id),
  portion_id uuid REFERENCES next_portions(id),
  intent_id uuid REFERENCES learning_intents(id),
  version integer NOT NULL,
  status text NOT NULL DEFAULT 'current',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  supersedes_id uuid REFERENCES progress_ledgers(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, child_membership_id, version)
);

CREATE TABLE IF NOT EXISTS progress_ledger_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  ledger_id uuid NOT NULL REFERENCES progress_ledgers(id) ON DELETE CASCADE,
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid NOT NULL REFERENCES memberships(id),
  path_item_id uuid,
  portion_item_id uuid,
  sort_order integer NOT NULL,
  title text NOT NULL,
  subject text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'recommended',
  source text NOT NULL DEFAULT 'refresh',
  composer_lesson_id uuid,
  composer_unit_id uuid,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ledger_id, sort_order)
);

CREATE INDEX IF NOT EXISTS progress_ledgers_child_idx
  ON progress_ledgers (org_id, child_membership_id, version DESC);

CREATE INDEX IF NOT EXISTS progress_ledgers_parent_child_idx
  ON progress_ledgers (org_id, parent_membership_id, child_membership_id, version DESC);

CREATE INDEX IF NOT EXISTS progress_ledger_units_child_idx
  ON progress_ledger_units (org_id, child_membership_id, ledger_id, sort_order);
