-- Profile M2+ enrichment. Adult only; every row is owned by a User (members.id).
-- media: campus-stored bytes. A pasted photo URL is kept as source only and never served.
-- Skills: one campus catalog shared by everyone, linked per User. Projects: linked per User,
-- and a User only ever matches against projects they are linked to.
-- Does not alter 0001-0019 except adding user_profiles.photo_media_id.
CREATE TABLE IF NOT EXISTS media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_member_id uuid NOT NULL REFERENCES members(id),
  purpose text NOT NULL CHECK (purpose IN ('profile_photo')),
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  byte_size integer NOT NULL CHECK (byte_size BETWEEN 1 AND 5242880),
  width integer NOT NULL CHECK (width BETWEEN 1 AND 8192),
  height integer NOT NULL CHECK (height BETWEEN 1 AND 8192),
  sha256 text NOT NULL CHECK (sha256 ~ '^[0-9a-f]{64}$'),
  bytes bytea NOT NULL,
  source_kind text NOT NULL CHECK (source_kind IN ('upload', 'url')),
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_source_shape CHECK (
    (source_kind = 'url' AND source_url ~ '^https://' AND length(source_url) <= 2048)
    OR (source_kind = 'upload' AND source_url IS NULL)
  ),
  CONSTRAINT media_owner UNIQUE (id, owner_member_id)
);

ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS photo_media_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_profiles_photo_media_owner') THEN
    ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_photo_media_owner
      FOREIGN KEY (photo_media_id, member_id) REFERENCES media (id, owner_member_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS profile_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  match_key text NOT NULL UNIQUE CHECK (length(match_key) BETWEEN 1 AND 80),
  aliases jsonb NOT NULL DEFAULT '[]'::jsonb,
  origin text NOT NULL CHECK (origin IN ('product', 'assessment', 'member', 'linkedin')),
  created_by_member_id uuid REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_skills_creator CHECK ((origin IN ('member', 'linkedin')) = (created_by_member_id IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS profile_skill_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id),
  skill_id uuid NOT NULL REFERENCES profile_skills(id),
  level text CHECK (level IN ('learning', 'working', 'strong', 'expert')),
  notes text NOT NULL DEFAULT '' CHECK (length(notes) <= 500),
  source text NOT NULL CHECK (source IN ('self', 'linkedin')),
  source_url text,
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_skill_links_member_skill UNIQUE (member_id, skill_id),
  CONSTRAINT profile_skill_links_source CHECK ((source = 'linkedin') = (imported_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS profile_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  link text NOT NULL DEFAULT '' CHECK (link = '' OR (link ~ '^https://' AND length(link) <= 500)),
  description text NOT NULL DEFAULT '' CHECK (length(description) <= 1000),
  created_by_member_id uuid NOT NULL REFERENCES members(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profile_project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id),
  project_id uuid NOT NULL REFERENCES profile_projects(id),
  match_key text NOT NULL CHECK (length(match_key) BETWEEN 1 AND 120),
  role text NOT NULL DEFAULT '' CHECK (length(role) <= 120),
  started_on text CHECK (started_on ~ '^[0-9]{4}(-[0-9]{2})?$'),
  ended_on text CHECK (ended_on ~ '^[0-9]{4}(-[0-9]{2})?$'),
  source text NOT NULL CHECK (source IN ('self', 'linkedin')),
  source_url text,
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_project_links_member_project UNIQUE (member_id, project_id),
  CONSTRAINT profile_project_links_member_name UNIQUE (member_id, match_key),
  CONSTRAINT profile_project_links_source CHECK ((source = 'linkedin') = (imported_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS profile_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id),
  kind text NOT NULL CHECK (kind IN ('headline', 'experience', 'education', 'certification')),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  organization text NOT NULL DEFAULT '' CHECK (length(organization) <= 200),
  started_on text CHECK (started_on ~ '^[0-9]{4}(-[0-9]{2})?$'),
  ended_on text CHECK (ended_on ~ '^[0-9]{4}(-[0-9]{2})?$'),
  match_key text NOT NULL,
  source text NOT NULL CHECK (source IN ('self', 'linkedin')),
  source_url text,
  imported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT profile_entries_member_item UNIQUE (member_id, kind, match_key),
  CONSTRAINT profile_entries_source CHECK ((source = 'linkedin') = (imported_at IS NOT NULL))
);

INSERT INTO profile_skills (name, match_key, aliases, origin) VALUES
  ('Writing briefs', 'writingbriefs', '["briefs", "brief writing", "job briefs"]'::jsonb, 'assessment'),
  ('Login maps', 'loginmaps', '["login map", "account map"]'::jsonb, 'assessment'),
  ('Running an AI crew', 'runninganaicrew', '["ai crew", "ai agents", "ai staff"]'::jsonb, 'assessment'),
  ('Shipping', 'shipping', '["shipping work", "ship"]'::jsonb, 'assessment')
ON CONFLICT (match_key) DO NOTHING;
