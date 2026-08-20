-- Student ↔ admin campus messages.

create table if not exists campus_messages (
  id serial primary key,
  student_id text not null,
  author_id text not null,
  author_role text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists campus_messages_student_idx
  on campus_messages (student_id, created_at);

create index if not exists campus_messages_unread_idx
  on campus_messages (author_role, read_at);
