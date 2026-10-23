-- GitHub integration storage. The Supabase service role is only used by server routes/workers.
-- RLS is enabled and no anon/authenticated policies are created for these tables.

create table if not exists public.github_users (
  github_user_id bigint primary key,
  login text not null,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.github_connections (
  github_user_id bigint primary key references public.github_users(github_user_id) on delete cascade,
  encrypted_credential text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.github_repositories (
  repository_id bigint primary key,
  owner text not null,
  name text not null,
  full_name text not null,
  description text,
  visibility text not null check (visibility in ('public', 'private')),
  default_branch text not null,
  language text,
  html_url text not null,
  updated_at timestamptz not null,
  synced_at timestamptz not null default now()
);

create table if not exists public.github_user_repositories (
  github_user_id bigint not null references public.github_users(github_user_id) on delete cascade,
  repository_id bigint not null references public.github_repositories(repository_id) on delete cascade,
  connected_at timestamptz not null default now(),
  primary key (github_user_id, repository_id)
);

create table if not exists public.github_analysis_jobs (
  id uuid primary key default gen_random_uuid(),
  github_user_id bigint not null references public.github_users(github_user_id) on delete cascade,
  repository_id bigint not null references public.github_repositories(repository_id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  progress smallint not null default 0 check (progress between 0 and 100),
  message text not null default 'Queued for analysis',
  attempt_count smallint not null default 0,
  result jsonb,
  error_code text,
  created_at timestamptz not null default now(),
  started_at timestamptz,
  finished_at timestamptz
);
create index if not exists github_analysis_jobs_queue_idx on public.github_analysis_jobs(status, created_at) where status = 'queued';
create index if not exists github_analysis_jobs_user_idx on public.github_analysis_jobs(github_user_id, created_at desc);

create table if not exists public.github_analyses (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null unique references public.github_analysis_jobs(id) on delete cascade,
  github_user_id bigint not null references public.github_users(github_user_id) on delete cascade,
  repository_id bigint not null references public.github_repositories(repository_id) on delete cascade,
  default_branch text not null,
  analyzed_commit text not null,
  file_count integer not null,
  source_file_count integer not null,
  language_totals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.github_users enable row level security;
alter table public.github_connections enable row level security;
alter table public.github_repositories enable row level security;
alter table public.github_user_repositories enable row level security;
alter table public.github_analysis_jobs enable row level security;
alter table public.github_analyses enable row level security;

create or replace function public.claim_github_analysis_job()
returns setof public.github_analysis_jobs
language sql
security definer
set search_path = public, pg_temp
as $$
  with exhausted_jobs as (
    update public.github_analysis_jobs
    set status = 'failed', progress = 100, message = 'Analysis worker stopped before finishing. Start a new analysis.',
        error_code = 'worker_interrupted', finished_at = now()
    where status = 'running' and started_at < now() - interval '30 minutes' and attempt_count >= 3
  ),
  next_job as (
    select id from public.github_analysis_jobs
    where status = 'queued'
       or (status = 'running' and started_at < now() - interval '30 minutes' and attempt_count < 3)
    order by created_at
    for update skip locked
    limit 1
  )
  update public.github_analysis_jobs job
  set status = 'running', progress = 5, message = 'Preparing repository analysis',
      started_at = now(), attempt_count = attempt_count + 1
  from next_job
  where job.id = next_job.id
  returning job.*;
$$;

revoke all on function public.claim_github_analysis_job() from public, anon, authenticated;
grant execute on function public.claim_github_analysis_job() to service_role;
grant all on public.github_users, public.github_connections, public.github_repositories,
  public.github_user_repositories, public.github_analysis_jobs, public.github_analyses to service_role;
