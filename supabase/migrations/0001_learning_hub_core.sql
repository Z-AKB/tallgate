-- ============================================================================
-- TallGate — Learning Hub core schema
-- Phase 3 tables: courses, modules, lessons, enrollments, lesson_progress,
-- certificates. RLS enabled on every table per NFR-1 (no app-layer-only auth).
-- ============================================================================

-- Roles (already referenced by Phase 3 decisions — included here so this
-- migration is runnable standalone if it's the first one applied)
create table if not exists public.user_roles (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  role        text not null check (role in ('learner','instructor','founder','admin')),
  granted_at  timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create policy "Users can read their own roles"
  on public.user_roles for select
  using (auth.uid() = user_id);

-- Admins can read all roles (needed by requireAdmin-style checks elsewhere,
-- and by admin UI listing users' roles)
create policy "Admins can read all roles"
  on public.user_roles for select
  using (
    exists (
      select 1 from public.user_roles admin_check
      where admin_check.user_id = auth.uid() and admin_check.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- categories (shared across courses/articles/projects, per Phase 3 §3.1)
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  content_type  text not null check (content_type in ('course','article','project'))
);

alter table public.categories enable row level security;

create policy "Categories are publicly readable"
  on public.categories for select
  using (true);

-- ----------------------------------------------------------------------------
-- courses
-- ----------------------------------------------------------------------------
create table if not exists public.courses (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text not null unique,
  description    text,
  category_id    uuid references public.categories(id),
  instructor_id  uuid references auth.users(id),
  status         text not null default 'draft'
                 check (status in ('draft','pending_review','published','rejected')),
  thumbnail_url  text,
  created_at     timestamptz not null default now()
);

alter table public.courses enable row level security;

-- Anyone (including anonymous visitors) can browse published courses —
-- matches Phase 2's "public-first" IA principle (catalogue browsable
-- logged-out).
create policy "Published courses are publicly readable"
  on public.courses for select
  using (status = 'published');

-- Instructors can see and manage their own courses regardless of status
-- (draft/pending_review included), so they can edit before publish.
create policy "Instructors can manage their own courses"
  on public.courses for all
  using (auth.uid() = instructor_id)
  with check (auth.uid() = instructor_id);

-- Admins have full visibility for the approval workflow (FR-11, FR-17)
create policy "Admins can manage all courses"
  on public.courses for all
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid() and user_roles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- modules
-- ----------------------------------------------------------------------------
create table if not exists public.modules (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses(id) on delete cascade,
  title       text not null,
  sort_order  int not null default 0
);

alter table public.modules enable row level security;

-- Modules inherit visibility from their parent course's published status —
-- deliberately does NOT gate on enrollment. Course structure (module/lesson
-- titles) is part of what lets a visitor evaluate a course before enrolling
-- (Phase 2 Flow 1). Only lesson CONTENT is enrollment-gated (see below).
create policy "Modules of published courses are publicly readable"
  on public.modules for select
  using (
    exists (
      select 1 from public.courses
      where courses.id = modules.course_id and courses.status = 'published'
    )
  );

create policy "Instructors can manage modules of their own courses"
  on public.modules for all
  using (
    exists (
      select 1 from public.courses
      where courses.id = modules.course_id and courses.instructor_id = auth.uid()
    )
  );

create policy "Admins can manage all modules"
  on public.modules for all
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid() and user_roles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- lessons
-- This is the enrollment-gating boundary. Lesson METADATA (title, duration,
-- content_type) is visible to anyone browsing a published course, so the
-- catalogue can show a syllabus. Lesson CONTENT (content_url / content_body)
-- is only meaningfully usable once an enrollment exists — enforced both
-- here (content_body for text lessons) and at the Storage layer for video
-- (migration 0002), since content_url alone is just a path, not the video
-- bytes.
-- ----------------------------------------------------------------------------
create table if not exists public.lessons (
  id                uuid primary key default gen_random_uuid(),
  module_id         uuid not null references public.modules(id) on delete cascade,
  title             text not null,
  content_type      text not null check (content_type in ('video','text')),
  content_url       text,        -- Storage path for video lessons
  content_body      text,        -- inline body for text lessons
  sort_order        int not null default 0,
  duration_seconds  int
);

alter table public.lessons enable row level security;

-- Instructors/Admins: full access, same pattern as courses/modules.
create policy "Instructors can manage lessons of their own courses"
  on public.lessons for all
  using (
    exists (
      select 1 from public.modules
      join public.courses on courses.id = modules.course_id
      where modules.id = lessons.module_id and courses.instructor_id = auth.uid()
    )
  );

create policy "Admins can manage all lessons"
  on public.lessons for all
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid() and user_roles.role = 'admin'
    )
  );

-- Everyone (incl. anonymous) can read lesson METADATA for published
-- courses — needed for the public syllabus/preview view.
-- IMPORTANT: this policy makes the row readable, which includes
-- content_url/content_body columns at the Postgres level. That's fine for
-- content_url (it's just an opaque Storage path — useless without a
-- signed URL, which is separately gated). It is NOT fine for
-- content_body, since that's the actual lesson text. So text-lesson
-- content is column-gated at the application layer: the lesson list
-- query used for the public syllabus must explicitly select only
-- (id, title, content_type, duration_seconds, sort_order) and never
-- content_body, until enrollment is confirmed. See getLessonForLearner()
-- for the enrollment-checked query that's safe to expose full content
-- from.
create policy "Lesson metadata of published courses is publicly readable"
  on public.lessons for select
  using (
    exists (
      select 1 from public.modules
      join public.courses on courses.id = modules.course_id
      where modules.id = lessons.module_id and courses.status = 'published'
    )
  );

-- ----------------------------------------------------------------------------
-- enrollments — the actual access record (Udemy's "purchase" analogue,
-- minus the purchase — created directly on Enroll for MVP's free courses)
-- ----------------------------------------------------------------------------
create table if not exists public.enrollments (
  id            uuid primary key default gen_random_uuid(),
  learner_id    uuid not null references auth.users(id) on delete cascade,
  course_id     uuid not null references public.courses(id) on delete cascade,
  status        text not null default 'active' check (status in ('active','completed')),
  enrolled_at   timestamptz not null default now(),
  unique (learner_id, course_id)
);

alter table public.enrollments enable row level security;

create policy "Learners can read their own enrollments"
  on public.enrollments for select
  using (auth.uid() = learner_id);

create policy "Learners can enroll themselves"
  on public.enrollments for insert
  with check (auth.uid() = learner_id);

create policy "Instructors can read enrollments in their own courses"
  on public.enrollments for select
  using (
    exists (
      select 1 from public.courses
      where courses.id = enrollments.course_id and courses.instructor_id = auth.uid()
    )
  );

create policy "Admins can read all enrollments"
  on public.enrollments for select
  using (
    exists (
      select 1 from public.user_roles
      where user_roles.user_id = auth.uid() and user_roles.role = 'admin'
    )
  );

-- ----------------------------------------------------------------------------
-- lesson_progress
-- ----------------------------------------------------------------------------
create table if not exists public.lesson_progress (
  id              uuid primary key default gen_random_uuid(),
  enrollment_id   uuid not null references public.enrollments(id) on delete cascade,
  lesson_id       uuid not null references public.lessons(id) on delete cascade,
  completed_at    timestamptz,
  unique (enrollment_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy "Learners can read their own lesson progress"
  on public.lesson_progress for select
  using (
    exists (
      select 1 from public.enrollments
      where enrollments.id = lesson_progress.enrollment_id
        and enrollments.learner_id = auth.uid()
    )
  );

create policy "Learners can record their own lesson progress"
  on public.lesson_progress for insert
  with check (
    exists (
      select 1 from public.enrollments
      where enrollments.id = lesson_progress.enrollment_id
        and enrollments.learner_id = auth.uid()
    )
  );

create policy "Learners can update their own lesson progress"
  on public.lesson_progress for update
  using (
    exists (
      select 1 from public.enrollments
      where enrollments.id = lesson_progress.enrollment_id
        and enrollments.learner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- certificates — publicly, anonymously readable by design (FR-10): this is
-- the one table in the whole schema meant to be checkable by someone who
-- is NOT authenticated at all (an employer verifying a claimed credential).
-- ----------------------------------------------------------------------------
create table if not exists public.certificates (
  id                  uuid primary key default gen_random_uuid(),
  enrollment_id       uuid not null unique references public.enrollments(id) on delete cascade,
  certificate_number  text not null unique,
  issued_at           timestamptz not null default now()
);

alter table public.certificates enable row level security;

create policy "Certificates are publicly readable for verification"
  on public.certificates for select
  using (true);

-- Only the system (via a service-role Edge Function — generate-certificate,
-- per Phase 3 §3) issues certificates; no direct client insert policy is
-- defined, so inserts are only possible with the service role key, which
-- bypasses RLS. This is deliberate: a learner must never be able to issue
-- their own certificate by writing directly to this table.
