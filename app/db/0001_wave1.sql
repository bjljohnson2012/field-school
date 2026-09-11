-- Wave 1 campus runtime schema. Idempotent.
-- Lives beside the Next app. Not migrations/0001-0003 (frozen TanStack).

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL,
  isolation text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  member_id uuid NOT NULL REFERENCES members(id),
  stance text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, member_id)
);

CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  slug text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS group_memberships (
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  membership_id uuid NOT NULL REFERENCES memberships(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, membership_id)
);

CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  object_type text NOT NULL,
  object_id text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS learning_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  actor_membership_id uuid NOT NULL REFERENCES memberships(id),
  actor_stance text NOT NULL,
  kind text NOT NULL,
  object_type text NOT NULL,
  object_id text NOT NULL,
  skill_ids text[] NOT NULL DEFAULT ARRAY[]::text[],
  score numeric,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learning_events_membership_idx
  ON learning_events (org_id, membership_id, created_at DESC);
CREATE INDEX IF NOT EXISTS learning_events_object_idx
  ON learning_events (org_id, membership_id, object_type, object_id);
CREATE INDEX IF NOT EXISTS assignments_membership_idx
  ON assignments (org_id, membership_id, object_id);

INSERT INTO organizations (slug, name, kind, isolation)
VALUES
  ('field-school', 'Field School', 'gym', 'public_catalog'),
  ('household', 'Household', 'homeschool', 'strict')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO groups (org_id, slug, name)
SELECT id, 'cohort-0', 'Cohort 0' FROM organizations WHERE slug = 'field-school'
ON CONFLICT (org_id, slug) DO NOTHING;

INSERT INTO groups (org_id, slug, name)
SELECT id, 'family', 'Family' FROM organizations WHERE slug = 'household'
ON CONFLICT (org_id, slug) DO NOTHING;
