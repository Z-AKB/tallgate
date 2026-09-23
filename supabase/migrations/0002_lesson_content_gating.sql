-- ============================================================================
-- TallGate — Lesson content access gating
-- Fixes a gap in 0001: content_url/content_body lived on `lessons`, the same
-- table exposed publicly (for the syllabus preview). Postgres RLS is
-- row-level, not column-level, so an unenrolled learner querying `lessons`
-- directly (not through app code) could read a text lesson's full body.
--
-- Fix: content lives in its own table (`lesson_content`) with its own RLS,
-- gated by enrollment/preview/instructor/admin. `lessons` keeps only
-- metadata and stays safely public for published courses.
--
-- CAUTION: this assumes 0001 has not yet been applied to a database holding
-- real lesson content. If it has, migrate `content_url`/`content_body` data
-- into `lesson_content` before running the DROP COLUMN statements below.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Preview lessons — mirrors Udemy's free-preview-lecture pattern so a
--    visitor can sample a course before enrolling (Phase 2 Flow 1's
--    "let her evaluate before committing" principle).
-- ----------------------------------------------------------------------------
alter table public.lessons
  add column if not exists is_preview boolean not null default false;

-- ----------------------------------------------------------------------------
-- 2. lesson_content — the actual gated payload, split out of `lessons`.
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_content (
  lesson_id     uuid primary key references public.lessons(id) on delete cascade,
  content_url   text,   -- Storage path, e.g. "{course_id}/{lesson_id}/video.mp4"
  content_body  text    -- inline body for text lessons
);

alter table public.lesson_content enable row level security;

-- No public/anon policy at all. Access requires one of:
--   (a) the lesson is marked is_preview, or
--   (b) an active enrollment in the lesson's course, or
--   (c) the requester is the course's instructor, or
--   (d) the requester is an admin.
create policy "Preview lesson content is readable by anyone"
  on public.lesson_content for select
  using (
    exists (
      select 1 from public.lessons
      where lessons.id = lesson_content.lesson_id and lessons.is_preview = true
    )
  );

create policy "Enrolled learners can read lesson content"
  on public.lesson_content for select
  using (
    exists (
      select 1
      from public.lessons
      join public.modules on modules.id = lessons.module_id
      join public.enrollments on enrollments.course_id = modules.course_id
      where lessons.id = lesson_content.lesson_id
        and enrollments.learner_id = auth.uid()
    )
  );

create policy "Instructors can manage content of their own lessons"
  on public.lesson_content for all
  using (
    exists (
      select 1
      from public.lessons
      join public.modules on modules.id = lessons.module_id
      join public.courses on courses.id = modules.course_id
      where lessons.id = lesson_content.lesson_id
        and courses.instructor_id = auth.uid()
    )
  );

create policy "Admins can manage all lesson content"
  on public.lesson_content for all
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid() and user_roles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- 3. Drop the now-redundant, unsafe columns from `lessons`. `lessons`
--    itself stays publicly readable for published courses (per 0001) —
--    that's now genuinely safe, since it no longer carries content.
-- ----------------------------------------------------------------------------
alter table public.lessons drop column if exists content_url;
alter table public.lessons drop column if exists content_body;

-- ----------------------------------------------------------------------------
-- 4. Storage RLS — defense in depth for video files specifically. Even if
--    a content_url path were ever logged, cached, or otherwise leaked,
--    downloading/signing the actual object still independently requires
--    passing this policy. Path convention: course-content/{course_id}/
--    {lesson_id}/{filename} — required so the policy can parse course_id
--    and lesson_id straight from the object path.
--
--    Run this section via the Supabase dashboard (Storage > Policies) or
--    the CLI — storage.objects policies are managed the same way as any
--    other table's RLS.
-- ----------------------------------------------------------------------------
create policy "Preview lesson videos are readable by anyone"
  on storage.objects for select
  using (
    bucket_id = 'course-content'
    and exists (
      select 1 from public.lessons
      where lessons.id = (storage.foldername(name))[2]::uuid
        and lessons.is_preview = true
    )
  );

create policy "Enrolled learners can read lesson videos"
  on storage.objects for select
  using (
    bucket_id = 'course-content'
    and exists (
      select 1 from public.enrollments
      where enrollments.course_id = (storage.foldername(name))[1]::uuid
        and enrollments.learner_id = auth.uid()
    )
  );

create policy "Instructors can manage video files for their own courses"
  on storage.objects for all
  using (
    bucket_id = 'course-content'
    and exists (
      select 1 from public.courses
      where courses.id = (storage.foldername(name))[1]::uuid
        and courses.instructor_id = auth.uid()
    )
  );

create policy "Admins can manage all course-content files"
  on storage.objects for all
  using (
    bucket_id = 'course-content'
    and exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid() and user_roles.role = 'admin'
    )
  );
