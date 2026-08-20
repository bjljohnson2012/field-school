-- Admin-customizable course banner.
--
-- banner_style controls how a course card renders its top strip:
--   'video'    – YouTube poster image (the original behavior, default)
--   'gradient' – a solid/gradient accent strip (no video thumbnail)
--   'none'     – no banner strip; a compact text-only card
-- banner_color is an optional CSS color used by the 'gradient' style; empty
-- means "use the theme accent".

alter table courses
  add column if not exists banner_style text not null default 'video';

alter table courses
  add column if not exists banner_color text not null default '';
