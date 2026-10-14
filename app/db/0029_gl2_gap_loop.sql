-- GL2 gap loop M2. Additive only. Does not alter 0028. Does not drop living-brain tables.
-- Does not retire kind homeschool. Embedding width N is 1024, stored to match EMBEDDING_CONFIG.

ALTER TABLE knowledge_nodes ADD COLUMN IF NOT EXISTS embedding vector(1024);
ALTER TABLE knowledge_nodes ADD COLUMN IF NOT EXISTS embedded_at timestamptz;
ALTER TABLE knowledge_nodes ADD COLUMN IF NOT EXISTS embedding_model text;

CREATE INDEX IF NOT EXISTS knowledge_nodes_embedding_hnsw
  ON knowledge_nodes USING hnsw (embedding vector_cosine_ops);

CREATE TABLE IF NOT EXISTS knowledge_research_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  task_id uuid,
  usd_micros integer NOT NULL CHECK (usd_micros >= 0),
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS knowledge_research_spend_month_idx
  ON knowledge_research_spend (created_at);

CREATE INDEX IF NOT EXISTS knowledge_research_spend_task_idx
  ON knowledge_research_spend (task_id);
