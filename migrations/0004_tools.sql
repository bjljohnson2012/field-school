-- Field School assessment tools: results stay on the learner's portal.

create table if not exists tool_results (
  user_id text not null,
  tool_slug text not null,
  result_json text not null default '{}',
  status text not null default 'started',
  updated_at timestamptz not null default now(),
  primary key (user_id, tool_slug)
);

create index if not exists tool_results_user_idx on tool_results (user_id);
