-- M11 brains. Additive only. Does not alter 0027. Does not drop living-brain tables.
-- B1 widens knowledge_nodes.kind. B2 adds no edge scope column.
-- B3 checks knowledge_edges.origin. A trigger checks that both endpoints share a scope
-- and copies that scope onto the edge.

ALTER TABLE knowledge_nodes DROP CONSTRAINT IF EXISTS knowledge_nodes_kind_check;
ALTER TABLE knowledge_nodes ADD CONSTRAINT knowledge_nodes_kind_check
  CHECK (kind IN (
    'goal', 'requirement', 'concept', 'cluster', 'evidence',
    'lesson', 'brain_page', 'reflection', 'skill', 'project'
  ));

ALTER TABLE knowledge_edges DROP CONSTRAINT IF EXISTS knowledge_edges_origin_check;
ALTER TABLE knowledge_edges ADD CONSTRAINT knowledge_edges_origin_check
  CHECK (origin IN ('system', 'derived', 'user', 'ai'));

CREATE OR REPLACE FUNCTION knowledge_edges_scope_check()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  from_row knowledge_nodes%ROWTYPE;
  to_row knowledge_nodes%ROWTYPE;
BEGIN
  SELECT * INTO from_row FROM knowledge_nodes WHERE id = NEW.from_node;
  SELECT * INTO to_row FROM knowledge_nodes WHERE id = NEW.to_node;
  IF from_row.id IS NULL OR to_row.id IS NULL THEN
    RAISE EXCEPTION 'edge_endpoint_missing';
  END IF;
  IF from_row.org_id IS DISTINCT FROM to_row.org_id
     OR from_row.growth_unit_id IS DISTINCT FROM to_row.growth_unit_id
     OR from_row.owner_kind IS DISTINCT FROM to_row.owner_kind
     OR from_row.owner_membership_id IS DISTINCT FROM to_row.owner_membership_id
     OR from_row.child_membership_id IS DISTINCT FROM to_row.child_membership_id THEN
    RAISE EXCEPTION 'edge_scope_mismatch';
  END IF;
  NEW.org_id := from_row.org_id;
  NEW.growth_unit_id := from_row.growth_unit_id;
  NEW.owner_kind := from_row.owner_kind;
  NEW.owner_membership_id := from_row.owner_membership_id;
  NEW.child_membership_id := from_row.child_membership_id;
  IF NEW.origin = 'ai' AND NEW.status IS DISTINCT FROM 'accepted' AND NEW.status IS DISTINCT FROM 'rejected' THEN
    NEW.status := 'proposed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS knowledge_edges_scope_check ON knowledge_edges;
CREATE TRIGGER knowledge_edges_scope_check
  BEFORE INSERT OR UPDATE ON knowledge_edges
  FOR EACH ROW
  EXECUTE FUNCTION knowledge_edges_scope_check();
