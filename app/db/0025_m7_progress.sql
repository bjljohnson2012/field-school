-- M7 enrollment and progress. Additive.
-- learning_events stays the log. Each progress row references that event.
-- Does not alter learning_events or progress_ledgers.

CREATE TABLE IF NOT EXISTS enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  course_slug text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, membership_id, course_slug)
);

CREATE TABLE IF NOT EXISTS progress_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  enrollment_id uuid NOT NULL REFERENCES enrollments(id),
  learning_event_id uuid NOT NULL REFERENCES learning_events(id),
  course_slug text NOT NULL,
  station_slug text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('watch', 'practice', 'check', 'exam')),
  score numeric,
  total integer,
  passed boolean NOT NULL DEFAULT false,
  raw jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS progress_attempts_latest_idx
  ON progress_attempts (org_id, membership_id, course_slug, station_slug, kind, created_at DESC);

CREATE INDEX IF NOT EXISTS progress_attempts_event_idx
  ON progress_attempts (learning_event_id);

CREATE OR REPLACE VIEW progress_latest AS
SELECT DISTINCT ON (org_id, membership_id, course_slug, station_slug, kind)
  id,
  org_id,
  membership_id,
  enrollment_id,
  learning_event_id,
  course_slug,
  station_slug,
  kind,
  score,
  total,
  passed,
  raw,
  created_at
FROM progress_attempts
ORDER BY org_id, membership_id, course_slug, station_slug, kind, created_at DESC, id DESC;
