-- Durable per-user fixed-window limits for app API work. No client role can call this function.
create table if not exists public.github_user_rate_limits (
  github_user_id bigint not null references public.github_users(github_user_id) on delete cascade,
  bucket text not null check (bucket ~ '^[a-z0-9_-]{1,40}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (github_user_id, bucket)
);

alter table public.github_user_rate_limits enable row level security;
grant all on public.github_user_rate_limits to service_role;

create or replace function public.consume_github_user_rate_limit(
  p_user_id bigint,
  p_bucket text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after integer, remaining integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_window timestamptz;
  v_count integer;
begin
  if p_user_id <= 0 or p_bucket !~ '^[a-z0-9_-]{1,40}$'
     or p_limit < 1 or p_limit > 10000
     or p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'invalid rate limit parameters';
  end if;

  v_window := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  insert into public.github_user_rate_limits as rate_limit (github_user_id, bucket, window_started_at, request_count)
  values (p_user_id, p_bucket, v_window, 1)
  on conflict (github_user_id, bucket) do update
    set window_started_at = excluded.window_started_at,
        request_count = case
          when rate_limit.window_started_at < excluded.window_started_at then 1
          else rate_limit.request_count + 1
        end
  returning request_count into v_count;

  return query select
    v_count <= p_limit,
    greatest(1, ceil(extract(epoch from (v_window + make_interval(secs => p_window_seconds) - now())))::integer),
    greatest(0, p_limit - v_count);
end;
$$;

revoke all on function public.consume_github_user_rate_limit(bigint, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_github_user_rate_limit(bigint, text, integer, integer) to service_role;
