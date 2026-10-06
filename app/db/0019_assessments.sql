-- Assessment Wizard (Profile M2+). One run per track attempt, owned by the adult User (members.id).
-- Raw answers live only while a run is in progress; finishing or expiring stores a sha256 and clears them.
-- Placements are additive: Field Pattern keeps member_profiles / revisions / instrument_runs as its record.
-- Does not alter 0001-0018.
CREATE TABLE IF NOT EXISTS assessment_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id),
  track text NOT NULL CHECK (track IN ('personality', 'skills', 'profile')),
  status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'complete', 'ceiling_unsettled', 'expired')),
  bank_version text NOT NULL,
  prior jsonb NOT NULL,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers_hash text,
  questions_asked integer NOT NULL DEFAULT 0 CHECK (questions_asked >= 0),
  resume_item_key text,
  started_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  gate_recorded_at timestamptz,
  CONSTRAINT assessment_runs_open_shape CHECK (
    (status = 'in_progress' AND completed_at IS NULL AND answers_hash IS NULL)
    OR (status IN ('complete', 'ceiling_unsettled') AND completed_at IS NOT NULL
        AND answers_hash IS NOT NULL AND answers = '[]'::jsonb AND resume_item_key IS NULL)
    OR (status = 'expired' AND completed_at IS NULL AND answers_hash IS NOT NULL
        AND answers = '[]'::jsonb AND resume_item_key IS NULL)
  ),
  CONSTRAINT assessment_runs_gate_after_finish CHECK (gate_recorded_at IS NULL OR completed_at IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS assessment_runs_one_open
  ON assessment_runs (member_id, track) WHERE status = 'in_progress';

CREATE INDEX IF NOT EXISTS assessment_runs_member_idx
  ON assessment_runs (member_id, track, completed_at);

CREATE TABLE IF NOT EXISTS assessment_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES assessment_runs(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES members(id),
  track text NOT NULL CHECK (track IN ('personality', 'skills', 'profile')),
  taxonomy text NOT NULL,
  category text NOT NULL,
  confidence_pct numeric(4, 1) NOT NULL CHECK (confidence_pct >= 0 AND confidence_pct <= 100),
  locked boolean NOT NULL,
  unsettled boolean NOT NULL,
  answered integer NOT NULL CHECK (answered >= 0),
  locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT assessment_placements_run_taxonomy UNIQUE (run_id, taxonomy),
  CONSTRAINT assessment_placements_one_state CHECK (locked <> unsettled),
  CONSTRAINT assessment_placements_lock_time CHECK (locked = (locked_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS assessment_placements_member_idx
  ON assessment_placements (member_id, track, taxonomy);
