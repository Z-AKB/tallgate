-- Harden the course-content storage read policies.
--
-- The original policies cast path segments to uuid directly:
--   (storage.foldername(name))[1]::uuid / [2]::uuid
-- A single object whose first/second path segment is not a valid UUID makes the
-- cast raise, which aborts policy evaluation and can break otherwise-legitimate
-- reads for the whole bucket. Guard the segments with a UUID-shaped regex
-- before casting.

drop policy if exists "Preview lesson videos are publicly readable" on storage.objects;
create policy "Preview lesson videos are publicly readable"
  on storage.objects
  for select
  to anon, authenticated
  using (
    bucket_id = 'course-content'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and (storage.foldername(name))[2] ~ '^[0-9a-fA-F-]{36}$'
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

drop policy if exists "Enrolled learners can read course videos" on storage.objects;
create policy "Enrolled learners can read course videos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'course-content'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and exists (
      select 1
      from public.course_enrollments
      where course_enrollments.course_id = (storage.foldername(name))[1]::uuid
        and course_enrollments.user_id = (select auth.uid())
        and course_enrollments.status in ('active', 'completed')
    )
  );
