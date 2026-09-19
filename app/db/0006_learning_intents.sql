-- FR-3 parent-owned learning intent versions.
-- Family mode only. Child ≠ User. No fourth SKU.
-- Idempotent. Do not write leftover TanStack db.

ALTER TABLE members ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'none';

UPDATE organizations
SET features = coalesce(features, '{}'::jsonb) || '{"mode":"family"}'::jsonb
WHERE slug = 'household';

UPDATE members m
SET mode = 'family'
WHERE m.kind <> 'child'
  AND m.mode <> 'family'
  AND EXISTS (
    SELECT 1
    FROM memberships ms
    JOIN organizations o ON o.id = ms.org_id
    WHERE ms.member_id = m.id
      AND o.slug = 'household'
      AND ms.stance IN ('guardian', 'admin')
  );

CREATE TABLE IF NOT EXISTS learning_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  parent_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid NOT NULL REFERENCES memberships(id),
  version integer NOT NULL,
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  subjects jsonb NOT NULL DEFAULT '[]'::jsonb,
  themes jsonb NOT NULL DEFAULT '[]'::jsonb,
  time_horizon text NOT NULL DEFAULT '',
  constraints jsonb NOT NULL DEFAULT '[]'::jsonb,
  tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  supersedes_id uuid REFERENCES learning_intents(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, child_membership_id, version)
);

CREATE INDEX IF NOT EXISTS learning_intents_child_idx
  ON learning_intents (org_id, child_membership_id, version DESC);

CREATE INDEX IF NOT EXISTS learning_intents_parent_child_idx
  ON learning_intents (org_id, parent_membership_id, child_membership_id, version DESC);
