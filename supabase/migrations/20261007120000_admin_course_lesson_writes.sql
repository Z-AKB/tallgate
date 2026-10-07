-- Admin-authored updates to courses and lessons are blocked today: both tables
-- are protected by row level security but only expose SELECT policies, so an
-- authenticated admin's UPDATE silently matches zero rows (PostgREST reports
-- success) instead of writing anything. That is why publishing a course,
-- marking it popular, assigning its domain, or flipping a lesson to the
-- "document" content type never persists.
--
-- These policies keep row level security enabled and grant the write path to
-- admins only, matching the existing "Admins can ..." policy style.

drop policy if exists "Admins can update courses" on public.courses;
create policy "Admins can update courses"
  on public.courses
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "Admins can update lessons" on public.lessons;
create policy "Admins can update lessons"
  on public.lessons
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Folder uploads may opt in to creating a lesson for a file that does not
-- match an existing lesson title; without an INSERT policy that write would
-- silently match nothing.
drop policy if exists "Admins can create lessons" on public.lessons;
create policy "Admins can create lessons"
  on public.lessons
  for insert
  to authenticated
  with check (public.is_admin());

-- Lesson creation is rolled back when the matching file cannot be attached.
drop policy if exists "Admins can delete lessons" on public.lessons;
create policy "Admins can delete lessons"
  on public.lessons
  for delete
  to authenticated
  using (public.is_admin());

