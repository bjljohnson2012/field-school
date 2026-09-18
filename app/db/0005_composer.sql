-- Wave 3 composer. Idempotent.
-- Tenant courses, lessons, sources, knowledge_units, quiz_items, publish_requests.
-- Do not write leftover TanStack db. Units come from supplied text only.

CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  slug text NOT NULL,
  title text NOT NULL,
  kind text NOT NULL DEFAULT 'text',
  status text NOT NULL DEFAULT 'draft',
  created_by_membership_id uuid REFERENCES memberships(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

CREATE TABLE IF NOT EXISTS lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  slug text NOT NULL,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  created_by_membership_id uuid REFERENCES memberships(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, course_id, slug)
);

CREATE TABLE IF NOT EXISTS sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  url text,
  book_title text,
  file_name text,
  file_path text,
  file_size bigint,
  mime text,
  created_by_membership_id uuid REFERENCES memberships(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quiz_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
  source_unit_id uuid NOT NULL REFERENCES knowledge_units(id),
  prompt text NOT NULL,
  choices jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer integer NOT NULL DEFAULT 0,
  why text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS publish_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  lesson_id uuid NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  requested_by_membership_id uuid REFERENCES memberships(id),
  status text NOT NULL DEFAULT 'approved',
  decided_by_membership_id uuid REFERENCES memberships(id),
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS courses_org_status_idx ON courses (org_id, status);
CREATE INDEX IF NOT EXISTS lessons_org_status_idx ON lessons (org_id, status);
CREATE INDEX IF NOT EXISTS sources_org_idx ON sources (org_id, lesson_id);
CREATE INDEX IF NOT EXISTS knowledge_units_org_source_idx ON knowledge_units (org_id, source_id);
CREATE INDEX IF NOT EXISTS quiz_items_org_unit_idx ON quiz_items (org_id, source_unit_id);
CREATE INDEX IF NOT EXISTS publish_requests_org_lesson_idx ON publish_requests (org_id, lesson_id);
