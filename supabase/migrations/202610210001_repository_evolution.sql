-- Commit range summaries contain file metadata only; GitHub patch/source content is never persisted here.
create table if not exists public.github_commit_comparisons (
  id uuid primary key default gen_random_uuid(),
  github_user_id bigint not null references public.github_users(github_user_id) on delete cascade,
  repository_id bigint not null references public.github_repositories(repository_id) on delete cascade,
  base_sha text not null check (base_sha ~ '^[0-9a-f]{40}$'),
  head_sha text not null check (head_sha ~ '^[0-9a-f]{40}$'),
  result jsonb not null,
  created_at timestamptz not null default now(),
  unique (github_user_id, repository_id, base_sha, head_sha),
  check (base_sha <> head_sha)
);
create index if not exists github_commit_comparisons_repo_idx
  on public.github_commit_comparisons(github_user_id, repository_id, created_at desc);
alter table public.github_commit_comparisons enable row level security;
grant all on public.github_commit_comparisons to service_role;
