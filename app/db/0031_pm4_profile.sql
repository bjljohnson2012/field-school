-- PM4 profile. Resume is an import source beside self and linkedin.
-- Does not change 0029 or 0030. Profile link and entry source checks only.

ALTER TABLE profile_skill_links DROP CONSTRAINT IF EXISTS profile_skill_links_source_check;
ALTER TABLE profile_skill_links DROP CONSTRAINT IF EXISTS profile_skill_links_source;
ALTER TABLE profile_skill_links
  ADD CONSTRAINT profile_skill_links_source_check CHECK (source IN ('self', 'linkedin', 'resume'));
ALTER TABLE profile_skill_links
  ADD CONSTRAINT profile_skill_links_source CHECK ((source IN ('linkedin', 'resume')) = (imported_at IS NOT NULL));

ALTER TABLE profile_project_links DROP CONSTRAINT IF EXISTS profile_project_links_source_check;
ALTER TABLE profile_project_links DROP CONSTRAINT IF EXISTS profile_project_links_source;
ALTER TABLE profile_project_links
  ADD CONSTRAINT profile_project_links_source_check CHECK (source IN ('self', 'linkedin', 'resume'));
ALTER TABLE profile_project_links
  ADD CONSTRAINT profile_project_links_source CHECK ((source IN ('linkedin', 'resume')) = (imported_at IS NOT NULL));

ALTER TABLE profile_entries DROP CONSTRAINT IF EXISTS profile_entries_source_check;
ALTER TABLE profile_entries DROP CONSTRAINT IF EXISTS profile_entries_source;
ALTER TABLE profile_entries
  ADD CONSTRAINT profile_entries_source_check CHECK (source IN ('self', 'linkedin', 'resume'));
ALTER TABLE profile_entries
  ADD CONSTRAINT profile_entries_source CHECK ((source IN ('linkedin', 'resume')) = (imported_at IS NOT NULL));
