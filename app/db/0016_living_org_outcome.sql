-- Plain org outcome stays on the living brain row. Not a second store.
-- Does not alter knowledge_brains. Does not alter 0001-0015.
ALTER TABLE living_brains
  ADD COLUMN IF NOT EXISTS outcome text NOT NULL DEFAULT '';
