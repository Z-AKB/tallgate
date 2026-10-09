-- Admin catalogue writes: adding a course and seeding the Learning Hub.
--
-- 20261007120000_admin_course_lesson_writes.sql completed the course authoring
-- path for UPDATE (publish, popularity, domain), but `courses` and
-- `course_modules` still only expose SELECT policies. With RLS enabled and no
-- INSERT policy, an authenticated admin's INSERT matches no rows (PostgREST
-- reports success) so neither "Add Course" nor "Seed/Sync Learning Hub
-- Courses" can persist anything.
--
-- Add the missing admin-only INSERT policies, matching the existing
-- "Admins can ..." style. Row level security stays enabled and the write path
-- stays limited to administrators; `lessons` already grants admin INSERT via
-- 20261007120000.

drop policy if exists "Admins can create courses" on public.courses;
create policy "Admins can create courses"
  on public.courses
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can create course modules" on public.course_modules;
create policy "Admins can create course modules"
  on public.course_modules
  for insert
  to authenticated
  with check (public.is_admin());
