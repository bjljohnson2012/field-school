-- Site settings (founder name + signature) and certifications (compilations of
-- courses that award a downloadable certificate once every member course is
-- certified).

create table if not exists site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists certifications (
  slug text primary key,
  title text not null,
  description text not null default '',
  published boolean not null default false,
  created_by text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists certification_courses (
  certification_slug text not null references certifications(slug) on delete cascade,
  course_slug text not null,
  sort_order integer not null default 0,
  primary key (certification_slug, course_slug)
);

create index if not exists certification_courses_slug_idx
  on certification_courses (certification_slug, sort_order);
