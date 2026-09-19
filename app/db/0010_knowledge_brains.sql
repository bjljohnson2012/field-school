-- FR-KB-1 family-first knowledge brain store.
-- Parent writes. Child ≠ User. Not composer knowledge_units. Not Pattern artifacts.
-- Team / org / person writes are schema-ready and API-rejected. Idempotent.
-- Do not write leftover TanStack db. Do not alter 0001-0009.

CREATE TABLE IF NOT EXISTS growth_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  kind text NOT NULL,
  title text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'current',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS growth_units_child_unique
  ON growth_units (org_id, child_membership_id)
  WHERE kind = 'child' AND child_membership_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS growth_units_family_unique
  ON growth_units (org_id, parent_membership_id)
  WHERE kind = 'family';

CREATE INDEX IF NOT EXISTS growth_units_child_idx
  ON growth_units (org_id, kind, child_membership_id);

CREATE INDEX IF NOT EXISTS growth_units_parent_idx
  ON growth_units (org_id, parent_membership_id, kind);

CREATE TABLE IF NOT EXISTS knowledge_brains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id) ON DELETE CASCADE,
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  version integer NOT NULL,
  status text NOT NULL DEFAULT 'current',
  intent jsonb NOT NULL DEFAULT '{}'::jsonb,
  paths jsonb NOT NULL DEFAULT '{}'::jsonb,
  progress jsonb NOT NULL DEFAULT '{}'::jsonb,
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  supersedes_id uuid REFERENCES knowledge_brains(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, growth_unit_id, version)
);

CREATE TABLE IF NOT EXISTS brain_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id) ON DELETE CASCADE,
  brain_id uuid NOT NULL REFERENCES knowledge_brains(id) ON DELETE CASCADE,
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  sort_order integer NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  uri text NOT NULL DEFAULT '',
  composer_source_id uuid,
  composer_unit_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brain_id, sort_order)
);

CREATE TABLE IF NOT EXISTS brain_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id) ON DELETE CASCADE,
  brain_id uuid NOT NULL REFERENCES knowledge_brains(id) ON DELETE CASCADE,
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  sort_order integer NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  uri text NOT NULL DEFAULT '',
  composer_source_id uuid,
  composer_unit_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brain_id, sort_order)
);

CREATE TABLE IF NOT EXISTS brain_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id) ON DELETE CASCADE,
  brain_id uuid NOT NULL REFERENCES knowledge_brains(id) ON DELETE CASCADE,
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  sort_order integer NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  uri text NOT NULL DEFAULT '',
  composer_source_id uuid,
  composer_unit_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brain_id, sort_order)
);

CREATE INDEX IF NOT EXISTS knowledge_brains_unit_idx
  ON knowledge_brains (org_id, growth_unit_id, version DESC);

CREATE INDEX IF NOT EXISTS knowledge_brains_child_idx
  ON knowledge_brains (org_id, child_membership_id, version DESC);

CREATE INDEX IF NOT EXISTS brain_sources_unit_idx
  ON brain_sources (org_id, growth_unit_id, brain_id, sort_order);

CREATE INDEX IF NOT EXISTS brain_notes_unit_idx
  ON brain_notes (org_id, growth_unit_id, brain_id, sort_order);

CREATE INDEX IF NOT EXISTS brain_artifacts_unit_idx
  ON brain_artifacts (org_id, growth_unit_id, brain_id, sort_order);
