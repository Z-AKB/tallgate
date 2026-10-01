-- A3: lesson_progress table + RLS + indexes
create table if not exists public.lesson_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  is_completed boolean not null default false,
  watch_time_seconds integer not null default 0,
  last_watched_at timestamptz,
  updated_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy if not exists "lesson_progress_select_own"
  on public.lesson_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy if not exists "lesson_progress_insert_own"
  on public.lesson_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy if not exists "lesson_progress_update_own"
  on public.lesson_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy if not exists "lesson_progress_admin_all"
  on public.lesson_progress for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists lesson_progress_user_id_idx on public.lesson_progress(user_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);
