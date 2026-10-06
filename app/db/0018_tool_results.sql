-- Tools Skill and Intelligence results, one row per attempt, owned by the signed-in User (members.id).
-- The server scores raw answers and stamps completed_at; the browser summary and clock are never stored.
-- attempt_id is minted by the browser at "See results": a retried save of one attempt keeps the first row.
-- No org column: private to the User. Does not alter 0001-0017.
CREATE TABLE IF NOT EXISTS tool_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id),
  tool_slug text NOT NULL CHECK (tool_slug IN ('skill', 'intelligence')),
  attempt_id uuid NOT NULL,
  answers jsonb NOT NULL,
  summary text NOT NULL,
  scores jsonb NOT NULL,
  labels jsonb NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tool_results_attempt UNIQUE (member_id, attempt_id)
);

CREATE INDEX IF NOT EXISTS tool_results_member_idx
  ON tool_results (member_id, tool_slug, completed_at);
