-- Restrict public curriculum metadata to published courses, and add a
-- server-only rate-limit store for public submission APIs.

drop policy if exists "Course modules viewable by everyone"
  on public.course_modules;

create policy "Published course modules are viewable by everyone"
  on public.course_modules
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.courses
      where courses.id = course_modules.course_id
        and (courses.is_published or public.is_admin())
    )
  );

create table if not exists public.api_rate_limits (
  bucket text not null check (
    bucket in ('contact', 'consultation', 'startup', 'enrollment', 'email')
  ),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  window_started timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (bucket, key_hash)
);

create index if not exists api_rate_limits_window_started_idx
  on public.api_rate_limits (window_started);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.api_rate_limits to service_role;

create or replace function public.consume_public_rate_limit(
  p_bucket text,
  p_key_hash text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_count integer;
  v_now timestamptz := pg_catalog.now();
begin
  if p_bucket is null
    or p_key_hash is null
    or p_limit is null
    or p_window_seconds is null
    or p_bucket not in ('contact', 'consultation', 'startup', 'enrollment', 'email')
    or p_key_hash !~ '^[0-9a-f]{64}$'
    or p_limit < 1
    or p_limit > 100
    or p_window_seconds < 60
    or p_window_seconds > 86400
  then
    raise exception 'Invalid rate-limit arguments.';
  end if;

  delete from public.api_rate_limits
  where window_started < v_now - interval '1 day';

  insert into public.api_rate_limits as existing (
    bucket,
    key_hash,
    window_started,
    request_count
  )
  values (p_bucket, p_key_hash, v_now, 1)
  on conflict (bucket, key_hash) do update
  set
    window_started = case
      when existing.window_started <= v_now -
        pg_catalog.make_interval(secs => p_window_seconds)
      then v_now
      else existing.window_started
    end,
    request_count = case
      when existing.window_started <= v_now -
        pg_catalog.make_interval(secs => p_window_seconds)
      then 1
      else least(existing.request_count + 1, p_limit + 1)
    end
  returning request_count into current_count;

  return current_count <= p_limit;
end;
$$;

revoke all on function public.consume_public_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_public_rate_limit(text, text, integer, integer)
  to service_role;
