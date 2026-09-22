-- Recent next steps stay on the living profile row. Not a second store.
-- Does not alter knowledge_brains. Does not alter 0001-0013.

ALTER TABLE living_profiles
  ADD COLUMN IF NOT EXISTS history text NOT NULL DEFAULT '[]';
