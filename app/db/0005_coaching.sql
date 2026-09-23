-- Coaching tables. Additive. Does not alter learning_events or memberships.stance.
-- Stance backfill copies memberships.stance. It does not grant platform_admin.
-- seed-operator-admin.mjs grants platform_admin for DEAN_EMAIL on field-school only.
-- 0005_composer.sql already owns sources and knowledge_units (lesson text).
-- Coaching files and articles are coaching_sources and coaching_knowledge_units.

CREATE TABLE IF NOT EXISTS membership_capabilities (
  membership_id uuid NOT NULL REFERENCES memberships(id),
  capability text NOT NULL,
  PRIMARY KEY (membership_id, capability)
);

INSERT INTO membership_capabilities (membership_id, capability)
SELECT id, stance
FROM memberships
WHERE stance IS DISTINCT FROM 'platform_admin'
ON CONFLICT (membership_id, capability) DO NOTHING;

CREATE TABLE IF NOT EXISTS coaching_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  coach_membership_id uuid NOT NULL REFERENCES memberships(id),
  subject_membership_id uuid NOT NULL REFERENCES memberships(id),
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, coach_membership_id, subject_membership_id, kind)
);

CREATE INDEX IF NOT EXISTS coaching_links_org_coach_idx
  ON coaching_links (org_id, coach_membership_id);

CREATE TABLE IF NOT EXISTS coaching_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  personality_summary text,
  sales_style_summary text,
  communication_summary text,
  leadership_summary text,
  forecasting_summary text,
  motivations jsonb NOT NULL DEFAULT '[]'::jsonb,
  strengths jsonb NOT NULL DEFAULT '[]'::jsonb,
  weaknesses jsonb NOT NULL DEFAULT '[]'::jsonb,
  enneagram_type text,
  disc_profile text,
  mbti_type text,
  coaching_hints jsonb,
  reasoning_summary text,
  synthesis_status text,
  synthesis_error text,
  synthesis_started_at timestamptz,
  last_synthesized_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, membership_id)
);

CREATE INDEX IF NOT EXISTS coaching_profiles_org_member_idx
  ON coaching_profiles (org_id, membership_id);

CREATE TABLE IF NOT EXISTS member_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id),
  source text NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (member_id, source)
);

CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  slug text NOT NULL,
  name text NOT NULL,
  summary text,
  audience text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

CREATE INDEX IF NOT EXISTS products_org_created_idx
  ON products (org_id, created_at);

CREATE TABLE IF NOT EXISTS questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  product_id uuid REFERENCES products(id),
  category text NOT NULL,
  question_type text NOT NULL,
  text text NOT NULL,
  options jsonb,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  weight numeric NOT NULL DEFAULT 1,
  active boolean NOT NULL DEFAULT true,
  author_membership_id uuid REFERENCES memberships(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS questions_org_created_idx
  ON questions (org_id, created_at);

CREATE TABLE IF NOT EXISTS answer_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  subject_membership_id uuid REFERENCES memberships(id),
  kind text NOT NULL,
  status text NOT NULL,
  version integer NOT NULL DEFAULT 1,
  resume_index integer NOT NULL DEFAULT 0,
  question_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS answer_sets_org_member_idx
  ON answer_sets (org_id, membership_id);

CREATE TABLE IF NOT EXISTS answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  answer_set_id uuid NOT NULL REFERENCES answer_sets(id),
  question_id uuid NOT NULL REFERENCES questions(id),
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (answer_set_id, question_id)
);

CREATE INDEX IF NOT EXISTS answers_org_created_idx
  ON answers (org_id, created_at);

CREATE TABLE IF NOT EXISTS recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  subject_membership_id uuid NOT NULL REFERENCES memberships(id),
  source text NOT NULL,
  category text NOT NULL,
  route_to text NOT NULL,
  channel text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  status text NOT NULL,
  source_unit_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS recommendations_org_subject_route_idx
  ON recommendations (org_id, subject_membership_id, route_to);

CREATE TABLE IF NOT EXISTS coaching_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  author_membership_id uuid NOT NULL REFERENCES memberships(id),
  subject_membership_id uuid NOT NULL REFERENCES memberships(id),
  body text NOT NULL,
  visible_to_learner boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coaching_notes_org_subject_idx
  ON coaching_notes (org_id, subject_membership_id);

CREATE TABLE IF NOT EXISTS coaching_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  subject_membership_id uuid NOT NULL REFERENCES memberships(id),
  author_membership_id uuid NOT NULL REFERENCES memberships(id),
  generated jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_name text,
  status text NOT NULL,
  error text,
  read_by jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coaching_plans_org_subject_idx
  ON coaching_plans (org_id, subject_membership_id);

CREATE TABLE IF NOT EXISTS one_on_one_preps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  subject_membership_id uuid NOT NULL REFERENCES memberships(id),
  author_membership_id uuid NOT NULL REFERENCES memberships(id),
  prep_doc_text text NOT NULL DEFAULT '',
  generated jsonb NOT NULL DEFAULT '{}'::jsonb,
  model_name text,
  status text NOT NULL,
  error text,
  read_by jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS one_on_one_preps_org_subject_idx
  ON one_on_one_preps (org_id, subject_membership_id);

CREATE TABLE IF NOT EXISTS reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  coach_membership_id uuid NOT NULL REFERENCES memberships(id),
  subject_membership_id uuid NOT NULL REFERENCES memberships(id),
  month_of timestamptz NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, coach_membership_id, subject_membership_id, month_of)
);

CREATE INDEX IF NOT EXISTS reviews_org_subject_idx
  ON reviews (org_id, subject_membership_id);

CREATE TABLE IF NOT EXISTS review_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  review_id uuid NOT NULL REFERENCES reviews(id),
  question_id uuid NOT NULL REFERENCES questions(id),
  value jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (review_id, question_id)
);

CREATE INDEX IF NOT EXISTS review_answers_org_created_idx
  ON review_answers (org_id, created_at);

CREATE TABLE IF NOT EXISTS work_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  assignee_membership_id uuid NOT NULL REFERENCES memberships(id),
  author_membership_id uuid NOT NULL REFERENCES memberships(id),
  subject_membership_id uuid REFERENCES memberships(id),
  title text NOT NULL,
  body text,
  status text NOT NULL,
  due_at timestamptz,
  completed_at timestamptz,
  recommendation_id uuid REFERENCES recommendations(id),
  plan_id uuid REFERENCES coaching_plans(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS work_items_org_assignee_idx
  ON work_items (org_id, assignee_membership_id);

CREATE TABLE IF NOT EXISTS coaching_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  kind text NOT NULL,
  title text NOT NULL,
  storage_path text,
  body text NOT NULL DEFAULT '',
  mime text,
  byte_size integer,
  visibility text NOT NULL,
  storage_status text NOT NULL,
  author_membership_id uuid NOT NULL REFERENCES memberships(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coaching_sources_org_author_idx
  ON coaching_sources (org_id, author_membership_id);

CREATE TABLE IF NOT EXISTS source_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  source_id uuid NOT NULL REFERENCES coaching_sources(id),
  kind text NOT NULL,
  intent text NOT NULL,
  visibility text NOT NULL,
  ai_suggested_kind text,
  ai_suggested_intent text,
  ai_confidence numeric,
  ai_rationale text,
  confirmed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS source_mappings_org_created_idx
  ON source_mappings (org_id, created_at);

CREATE TABLE IF NOT EXISTS knowledge_repos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  repo_kind text NOT NULL,
  name text NOT NULL,
  visibility text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, repo_kind, name)
);

CREATE INDEX IF NOT EXISTS knowledge_repos_org_created_idx
  ON knowledge_repos (org_id, created_at);

CREATE TABLE IF NOT EXISTS coaching_knowledge_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  repository_id uuid NOT NULL REFERENCES knowledge_repos(id),
  source_id uuid REFERENCES coaching_sources(id),
  product_id uuid REFERENCES products(id),
  title text NOT NULL,
  body text NOT NULL,
  skill_slugs text[] NOT NULL DEFAULT '{}',
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL,
  visibility text NOT NULL,
  author_membership_id uuid REFERENCES memberships(id),
  approver_membership_id uuid REFERENCES memberships(id),
  embedding jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coaching_knowledge_units_org_created_idx
  ON coaching_knowledge_units (org_id, created_at);

CREATE TABLE IF NOT EXISTS ad_hoc_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  subject_membership_id uuid NOT NULL REFERENCES memberships(id),
  author_membership_id uuid NOT NULL REFERENCES memberships(id),
  title text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  status text NOT NULL,
  question_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  answer_set_id uuid REFERENCES answer_sets(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ad_hoc_quizzes_org_subject_idx
  ON ad_hoc_quizzes (org_id, subject_membership_id);

CREATE TABLE IF NOT EXISTS quiz_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  subject_membership_id uuid NOT NULL REFERENCES memberships(id),
  cadence text NOT NULL,
  next_run_at timestamptz NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quiz_schedules_org_subject_idx
  ON quiz_schedules (org_id, subject_membership_id);

CREATE TABLE IF NOT EXISTS retake_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  requester_membership_id uuid NOT NULL REFERENCES memberships(id),
  quiz_id uuid REFERENCES ad_hoc_quizzes(id),
  answer_set_id uuid REFERENCES answer_sets(id),
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS retake_requests_org_requester_idx
  ON retake_requests (org_id, requester_membership_id);

CREATE TABLE IF NOT EXISTS drill_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  skill_category text NOT NULL,
  prompt text NOT NULL,
  user_response text,
  ai_score integer,
  points_awarded integer NOT NULL DEFAULT 0,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS drill_attempts_org_member_idx
  ON drill_attempts (org_id, membership_id);

CREATE TABLE IF NOT EXISTS performance_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  membership_id uuid NOT NULL REFERENCES memberships(id),
  year integer NOT NULL,
  quarter integer NOT NULL,
  quota_cents integer,
  attained_cents integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, membership_id, year, quarter)
);

CREATE INDEX IF NOT EXISTS performance_snapshots_org_member_idx
  ON performance_snapshots (org_id, membership_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organizations(id),
  actor_membership_id uuid NOT NULL REFERENCES memberships(id),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS audit_logs_org_created_idx
  ON audit_logs (org_id, created_at);

CREATE TABLE IF NOT EXISTS legacy_ids (
  source text NOT NULL,
  legacy_id text NOT NULL,
  table_name text NOT NULL,
  new_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (source, table_name, legacy_id)
);
