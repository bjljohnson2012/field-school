-- M6 content model. Courses and lessons gain blocks. New outline tables.
-- Does not change profile, wizard, or gap-loop tables.

ALTER TABLE courses ADD COLUMN IF NOT EXISTS example boolean NOT NULL DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS _status text NOT NULL DEFAULT 'draft';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS blocks jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS outcome_ids jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS _status text NOT NULL DEFAULT 'draft';
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS blocks jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS outcome_ids jsonb NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS "order" integer NOT NULL DEFAULT 0;

UPDATE courses SET _status = status WHERE _status IS DISTINCT FROM status;
UPDATE lessons SET _status = status WHERE _status IS DISTINCT FROM status;

UPDATE lessons
SET blocks = jsonb_build_array(jsonb_build_object('kind', 'text', 'text', body))
WHERE blocks = '[]'::jsonb
  AND length(trim(body)) > 0;

CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  course_id uuid NOT NULL REFERENCES courses(id),
  slug text NOT NULL,
  title text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  _status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, course_id, slug)
);

ALTER TABLE lessons ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES modules(id);

CREATE TABLE IF NOT EXISTS practice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  lesson_id uuid NOT NULL REFERENCES lessons(id),
  kind text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  block_index integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lesson_id, kind, block_index)
);

CREATE TABLE IF NOT EXISTS course_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  parent_id uuid NOT NULL REFERENCES courses(id),
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, version)
);

CREATE TABLE IF NOT EXISTS lesson_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  parent_id uuid NOT NULL REFERENCES lessons(id),
  version integer NOT NULL,
  snapshot jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, version)
);
