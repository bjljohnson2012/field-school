-- Knowledge-Gap Loop M1. Goal, requirements, cited nodes, gaps, one request, and the run log.
-- Does not alter 0001-0020. No vector column. Idempotent.

CREATE TABLE IF NOT EXISTS outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id),
  owner_kind text NOT NULL CHECK (owner_kind IN ('person', 'child', 'family', 'team', 'org')),
  owner_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  title text NOT NULL DEFAULT '',
  statement text NOT NULL,
  horizon text NOT NULL DEFAULT '',
  done_conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'done', 'archived')),
  version integer NOT NULL DEFAULT 1,
  supersedes_id uuid,
  intent_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outcomes_owner_idx
  ON outcomes (org_id, owner_membership_id, created_at DESC);

CREATE INDEX IF NOT EXISTS outcomes_unit_idx
  ON outcomes (growth_unit_id);

CREATE TABLE IF NOT EXISTS outcome_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id),
  owner_kind text NOT NULL CHECK (owner_kind IN ('person', 'child', 'family', 'team', 'org')),
  owner_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  outcome_id uuid NOT NULL REFERENCES outcomes(id) ON DELETE CASCADE,
  sort_order integer NOT NULL,
  label text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('knowledge', 'skill', 'demonstration')),
  weight integer NOT NULL DEFAULT 1,
  done_condition jsonb NOT NULL DEFAULT '{}'::jsonb,
  coverage integer NOT NULL DEFAULT 0,
  system_confidence text NOT NULL DEFAULT 'Low' CHECK (system_confidence IN ('Low', 'Medium', 'High')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'met', 'waived')),
  origin text NOT NULL DEFAULT 'system' CHECK (origin IN ('system', 'owner')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT outcome_requirements_order UNIQUE (outcome_id, sort_order)
);

CREATE INDEX IF NOT EXISTS outcome_requirements_outcome_idx
  ON outcome_requirements (outcome_id, sort_order);

CREATE TABLE IF NOT EXISTS knowledge_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id),
  owner_kind text NOT NULL CHECK (owner_kind IN ('person', 'child', 'family', 'team', 'org')),
  owner_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  requirement_id uuid REFERENCES outcome_requirements(id) ON DELETE SET NULL,
  kind text NOT NULL CHECK (kind IN ('goal', 'requirement', 'concept', 'cluster', 'evidence')),
  label text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  sha256 text,
  filename text,
  ref_table text,
  ref_id text,
  evidence jsonb NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_nodes_evidence_len CHECK (jsonb_typeof(evidence) = 'array' AND jsonb_array_length(evidence) >= 1)
);

CREATE INDEX IF NOT EXISTS knowledge_nodes_unit_idx
  ON knowledge_nodes (org_id, growth_unit_id, created_at DESC);

CREATE INDEX IF NOT EXISTS knowledge_nodes_requirement_idx
  ON knowledge_nodes (requirement_id);

CREATE TABLE IF NOT EXISTS knowledge_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id),
  owner_kind text NOT NULL CHECK (owner_kind IN ('person', 'child', 'family', 'team', 'org')),
  owner_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  from_node uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  to_node uuid NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  rel text NOT NULL CHECK (rel IN ('supports', 'requires', 'part_of', 'contradicts')),
  because text NOT NULL DEFAULT '',
  evidence jsonb NOT NULL,
  weight integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'accepted', 'rejected')),
  origin text NOT NULL DEFAULT 'system',
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT knowledge_edges_evidence_len CHECK (jsonb_typeof(evidence) = 'array' AND jsonb_array_length(evidence) >= 1)
);

CREATE INDEX IF NOT EXISTS knowledge_edges_from_idx ON knowledge_edges (from_node);
CREATE INDEX IF NOT EXISTS knowledge_edges_to_idx ON knowledge_edges (to_node);

CREATE TABLE IF NOT EXISTS loop_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id),
  owner_kind text NOT NULL CHECK (owner_kind IN ('person', 'child', 'family', 'team', 'org')),
  owner_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  outcome_id uuid NOT NULL REFERENCES outcomes(id) ON DELETE CASCADE,
  state text NOT NULL DEFAULT 'draft',
  cycle integer NOT NULL DEFAULT 1,
  step_count integer NOT NULL DEFAULT 0,
  max_steps integer NOT NULL DEFAULT 12,
  no_progress_cycles integer NOT NULL DEFAULT 0,
  last_score integer NOT NULL DEFAULT 0,
  stop_reason text,
  lease_owner text,
  lease_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS loop_runs_outcome_idx ON loop_runs (outcome_id);

CREATE TABLE IF NOT EXISTS loop_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id),
  owner_kind text NOT NULL CHECK (owner_kind IN ('person', 'child', 'family', 'team', 'org')),
  owner_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  run_id uuid NOT NULL REFERENCES loop_runs(id) ON DELETE CASCADE,
  seq integer NOT NULL,
  idempotency_key text NOT NULL,
  from_state text NOT NULL,
  to_state text NOT NULL,
  kind text NOT NULL,
  summary text NOT NULL,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb,
  model text,
  tokens_in integer,
  tokens_out integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT loop_events_run_seq UNIQUE (run_id, seq),
  CONSTRAINT loop_events_idempotency UNIQUE (idempotency_key)
);

CREATE INDEX IF NOT EXISTS loop_events_owner_day_idx
  ON loop_events (owner_membership_id, created_at);

CREATE TABLE IF NOT EXISTS gap_findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id),
  owner_kind text NOT NULL CHECK (owner_kind IN ('person', 'child', 'family', 'team', 'org')),
  owner_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  outcome_id uuid NOT NULL REFERENCES outcomes(id) ON DELETE CASCADE,
  requirement_id uuid NOT NULL REFERENCES outcome_requirements(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('missing_knowledge', 'missing_demonstration', 'missing_link', 'stale', 'conflict')),
  summary text NOT NULL,
  coverage_at_find integer NOT NULL DEFAULT 0,
  priority integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'asked', 'closing', 'closed', 'rejected', 'waived')),
  reject_reason text,
  evidence_key text NOT NULL DEFAULT '',
  found_in_run_id uuid REFERENCES loop_runs(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS gap_findings_outcome_idx
  ON gap_findings (outcome_id, status, priority DESC);

CREATE TABLE IF NOT EXISTS research_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  growth_unit_id uuid NOT NULL REFERENCES growth_units(id),
  owner_kind text NOT NULL CHECK (owner_kind IN ('person', 'child', 'family', 'team', 'org')),
  owner_membership_id uuid NOT NULL REFERENCES memberships(id),
  child_membership_id uuid REFERENCES memberships(id),
  gap_id uuid NOT NULL REFERENCES gap_findings(id) ON DELETE CASCADE,
  question text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('upload', 'answer', 'rating', 'lesson', 'web')),
  request_copy text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed', 'awaiting_user', 'approved', 'running', 'done', 'declined', 'expired')),
  query_text text,
  approved_by_membership_id uuid,
  approved_at timestamptz,
  response jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS research_tasks_gap_idx ON research_tasks (gap_id, status);
