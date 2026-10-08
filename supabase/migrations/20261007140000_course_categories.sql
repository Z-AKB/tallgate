-- Course categories: the admin-managed list of Learning Hub domains.
--
-- Courses keep their `category` text column so existing rows are untouched,
-- but the admin curriculum screen now sources its domain picker from this
-- table instead of inventing labels per screen. The seed mirrors the public
-- catalogue in lib/data/courses.ts.

create table if not exists public.course_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.course_categories enable row level security;

drop policy if exists "Course categories are viewable by everyone" on public.course_categories;
create policy "Course categories are viewable by everyone"
  on public.course_categories
  for select
  using (true);

drop policy if exists "Admins can manage course categories" on public.course_categories;
create policy "Admins can manage course categories"
  on public.course_categories
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

insert into public.course_categories (name, display_order) values
  ('Development', 1),
  ('Digital Skills', 2),
  ('Security', 3),
  ('Foundation', 4),
  ('Professional', 5),
  ('Health Technology', 6)
on conflict (name) do nothing;