-- Plain confidence stays on the living profile row. Not a second store.
-- Does not alter knowledge_brains. Does not alter 0001-0014.

ALTER TABLE living_profiles
  ADD COLUMN IF NOT EXISTS confidence text NOT NULL DEFAULT '';
