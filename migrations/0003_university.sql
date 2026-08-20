-- Johnson Field School University: multi-course catalog + per-course progress.

create table if not exists faculty (
  user_id text primary key,
  role text not null default 'dean',
  created_at timestamptz not null default now()
);

create table if not exists courses (
  slug text primary key,
  title text not null,
  tagline text not null default '',
  kicker text not null default '',
  video_id text not null default '',
  video_url text not null default '',
  video_title text not null default '',
  context_notes text not null default '',
  published boolean not null default false,
  created_by text not null,
  pass_ratio real not null default 0.75,
  exam_pass_ratio real not null default 0.8,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists course_modules (
  course_slug text not null references courses(slug) on delete cascade,
  slug text not null,
  station text not null,
  title text not null,
  kicker text not null default '',
  duration_label text not null default '',
  summary text not null default '',
  thesis text not null default '',
  body_json text not null default '{}',
  sort_order integer not null default 0,
  primary key (course_slug, slug)
);

create table if not exists course_exam (
  course_slug text not null references courses(slug) on delete cascade,
  question_id text not null,
  prompt text not null,
  choices_json text not null default '[]',
  answer integer not null default 0,
  why text not null default '',
  sort_order integer not null default 0,
  primary key (course_slug, question_id)
);

create table if not exists enrollment_progress (
  user_id text not null,
  course_slug text not null,
  module_slug text not null,
  watched boolean not null default false,
  assignment_json text not null default '{}',
  notes text not null default '',
  quiz_score integer,
  quiz_passed boolean not null default false,
  passed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_slug, module_slug)
);

create table if not exists enrollment_exams (
  id serial primary key,
  user_id text not null,
  course_slug text not null,
  score integer not null,
  passed boolean not null,
  answers text not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists enrollment_desks (
  user_id text not null,
  course_slug text not null,
  payload text not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, course_slug)
);

create index if not exists enrollment_exams_user_course_idx
  on enrollment_exams (user_id, course_slug);
