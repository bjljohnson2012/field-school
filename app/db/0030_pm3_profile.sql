-- PM3 profile share. Additive. Does not alter 0028. Does not take 0029.
-- Adults only. Kid profiles gain no photo, slug, or share column.
-- Sharing is off until the adult opts in. A revoke clears the slug.

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS headline text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS bio text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS linkedin_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS share_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS share_slug text,
  ADD COLUMN IF NOT EXISTS public_skills jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS public_projects jsonb NOT NULL DEFAULT '[]'::jsonb;

CREATE UNIQUE INDEX IF NOT EXISTS user_profiles_share_slug_idx
  ON user_profiles (share_slug)
  WHERE share_slug IS NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_share_shape') THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_share_shape
      CHECK (
        (share_enabled = false AND share_slug IS NULL)
        OR (
          share_enabled = true
          AND share_slug ~ '^[A-Za-z0-9_-]{10,80}$'
          AND share_slug !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        )
      );
  END IF;
END $$;
