alter table public.lessons
  drop constraint if exists lessons_content_type_check;

alter table public.lessons
  add constraint lessons_content_type_check
  check (content_type in ('video', 'text', 'document'));

create table public.live_sessions (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  scheduled_at timestamptz not null,
  join_url text not null check (join_url ~ '^https://'),
  recording_lesson_id uuid references public.lessons(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index live_sessions_course_scheduled_at_idx
  on public.live_sessions(course_id, scheduled_at);

alter table public.live_sessions enable row level security;

revoke all on public.live_sessions from anon, authenticated;
grant select, insert, update, delete on public.live_sessions to authenticated;

create policy "Enrolled learners and admins can read live sessions"
  on public.live_sessions
  for select
  to authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.course_enrollments
      where course_enrollments.course_id = live_sessions.course_id
        and course_enrollments.user_id = (select auth.uid())
        and course_enrollments.status in ('active', 'completed')
    )
  );

create policy "Admins can manage live sessions"
  on public.live_sessions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create or replace function public.validate_live_session_recording()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  recording_course_id uuid;
  recording_content_type text;
begin
  if new.recording_lesson_id is null then
    return new;
  end if;

  select course_modules.course_id, lessons.content_type
    into recording_course_id, recording_content_type
  from public.lessons
  join public.course_modules on course_modules.id = lessons.module_id
  where lessons.id = new.recording_lesson_id;

  if recording_course_id is distinct from new.course_id
     or recording_content_type is distinct from 'video' then
    raise exception 'A live-session recording must be a video lesson in the same course.';
  end if;

  return new;
end;
$$;

create trigger validate_live_session_recording_before_write
  before insert or update of course_id, recording_lesson_id
  on public.live_sessions
  for each row execute function public.validate_live_session_recording();
