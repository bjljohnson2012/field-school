create table if not exists course_progress (
  user_id text not null,
  module_slug text not null,
  watched boolean not null default false,
  assignment_json text not null default '{}',
  notes text not null default '',
  quiz_score integer,
  quiz_passed boolean not null default false,
  passed boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, module_slug)
);

create table if not exists staff_desk (
  user_id text primary key,
  payload text not null,
  updated_at timestamptz not null default now()
);

create table if not exists exam_attempts (
  id serial primary key,
  user_id text not null,
  score integer not null,
  passed boolean not null,
  answers text not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists exam_attempts_user_idx on exam_attempts (user_id);
