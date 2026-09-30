-- The Phase 3 schema is authoritative. Keep lesson payloads separate from
-- publicly-readable lesson metadata and gate them through RLS.
alter table public.lessons
  add column if not exists is_preview boolean not null default false;

alter table public.lessons
  add column if not exists content_type text not null default 'text'
  check (content_type in ('video', 'text'));

create table public.lesson_content (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  content_url text,
  content_body text
);

insert into public.lesson_content (lesson_id, content_body)
select id, content_markdown
from public.lessons
where content_markdown is not null;

revoke all on public.lesson_content from anon, authenticated;
grant select on public.lesson_content to anon, authenticated;
grant insert, update, delete on public.lesson_content to authenticated;

alter table public.lessons drop column content_markdown;

alter table public.lesson_content enable row level security;

create policy "Published preview lesson content is publicly readable"
  on public.lesson_content
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.lessons
      join public.course_modules on course_modules.id = lessons.module_id
      join public.courses on courses.id = course_modules.course_id
      where lessons.id = lesson_content.lesson_id
        and lessons.is_preview
        and courses.is_published
    )
  );

create policy "Enrolled learners can read lesson content"
  on public.lesson_content
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.lessons
      join public.course_modules on course_modules.id = lessons.module_id
      join public.course_enrollments
        on course_enrollments.course_id = course_modules.course_id
      where lessons.id = lesson_content.lesson_id
        and course_enrollments.user_id = (select auth.uid())
        and course_enrollments.status in ('active', 'completed')
    )
  );

drop policy if exists "Lessons viewable by enrolled users or preview or admin"
  on public.lessons;

create policy "Published lessons are viewable by preview or enrolled users"
  on public.lessons
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.course_modules
      join public.courses on courses.id = course_modules.course_id
      where course_modules.id = lessons.module_id
        and courses.is_published
        and (
          lessons.is_preview
          or public.is_admin()
          or exists (
            select 1
            from public.course_enrollments
            where course_enrollments.course_id = courses.id
              and course_enrollments.user_id = (select auth.uid())
              and course_enrollments.status in ('active', 'completed')
          )
        )
    )
  );

create policy "Admins can manage lesson content"
  on public.lesson_content
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Preview lesson videos are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'course-content'
    and exists (
      select 1
      from public.lessons
      join public.course_modules on course_modules.id = lessons.module_id
      join public.courses on courses.id = course_modules.course_id
      where lessons.id = (storage.foldername(name))[2]::uuid
        and lessons.is_preview
        and courses.is_published
    )
  );

create policy "Enrolled learners can read course videos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'course-content'
    and exists (
      select 1
      from public.course_enrollments
      where course_enrollments.course_id = (storage.foldername(name))[1]::uuid
        and course_enrollments.user_id = (select auth.uid())
        and course_enrollments.status in ('active', 'completed')
    )
  );

create policy "Admins can manage course content files"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'course-content'
    and public.is_admin()
  )
  with check (
    bucket_id = 'course-content'
    and public.is_admin()
  );
