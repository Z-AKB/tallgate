-- Keep public writes behind validated, rate-limited server routes.
-- The routes use the service-role client only after input validation and
-- rate-limit checks; direct PostgREST inserts must not bypass those controls.

revoke insert on table
  public.contact_messages,
  public.consultation_requests,
  public.startup_applications,
  public.service_inquiries
from public, anon, authenticated;

grant insert on table
  public.contact_messages,
  public.consultation_requests,
  public.startup_applications,
  public.service_inquiries
to service_role;

-- Active course access must be granted through a trusted administrative path.
drop policy if exists "Users can insert own enrollment"
  on public.course_enrollments;

revoke insert on table public.course_enrollments
  from public, anon, authenticated;
grant insert on table public.course_enrollments to service_role;

-- Certificate verification is a public operation with a separate, bounded
-- per-IP request budget.
alter table public.api_rate_limits
  drop constraint if exists api_rate_limits_bucket_check;

alter table public.api_rate_limits
  add constraint api_rate_limits_bucket_check
  check (
    bucket in (
      'contact',
      'consultation',
      'startup',
      'enrollment',
      'email',
      'verification'
    )
  );

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
    or p_bucket not in (
      'contact',
      'consultation',
      'startup',
      'enrollment',
      'email',
      'verification'
    )
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
