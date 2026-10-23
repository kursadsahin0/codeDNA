-- Normalized static-analysis graph; only service-role workers can write repository source results.
alter table public.github_analyses
  add column if not exists graph jsonb not null default '{"version":1,"nodes":[],"edges":[]}'::jsonb,
  add column if not exists diagnostics jsonb not null default '[]'::jsonb,
  add column if not exists changed_files jsonb not null default '[]'::jsonb,
  add column if not exists commit_subject text not null default '',
  add column if not exists analysis_status text not null default 'success' check (analysis_status in ('success', 'partial', 'failed')),
  add column if not exists analyzed_file_count integer not null default 0 check (analyzed_file_count >= 0),
  add column if not exists skipped_file_count integer not null default 0 check (skipped_file_count >= 0),
  add column if not exists error_count integer not null default 0 check (error_count >= 0),
  add column if not exists duration_ms integer not null default 0 check (duration_ms >= 0),
  add column if not exists parser_version text not null default 'unknown';

create table if not exists public.github_analysis_cache (
  repository_id bigint not null references public.github_repositories(repository_id) on delete cascade,
  analyzed_commit text not null,
  parser_version text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  primary key (repository_id, analyzed_commit, parser_version)
);
alter table public.github_analysis_cache enable row level security;
grant all on public.github_analysis_cache to service_role;
