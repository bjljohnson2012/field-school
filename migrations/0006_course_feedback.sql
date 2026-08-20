-- Post-course feedback from signed-in learners, viewable by admins only.
-- One row per (user, course); re-submitting replaces the earlier row.

create table if not exists course_feedback (
  id serial primary key,
  user_id text not null,
  course_slug text not null,
  rating integer not null,
  comment text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists course_feedback_course_idx
  on course_feedback (course_slug, created_at);

create unique index if not exists course_feedback_user_course_idx
  on course_feedback (user_id, course_slug);
