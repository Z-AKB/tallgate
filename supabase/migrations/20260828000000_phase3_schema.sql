-- ==============================================================================
-- TALLGATE PLATFORM: PHASE 3 PRODUCTION DATABASE SCHEMA (14 TABLES + RLS)
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES (Users linked to auth.users)
-- ------------------------------------------------------------------------------
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    full_name text not null,
    email text not null,
    phone text,
    company_name text,
    location text,
    avatar_url text,
    bio text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 2. ROLES
-- ------------------------------------------------------------------------------
create table if not exists roles (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,
    description text,
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 3. USER_ROLES (Multi-role Join Table)
-- ------------------------------------------------------------------------------
create table if not exists user_roles (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    role_id uuid not null references roles(id) on delete cascade,
    assigned_at timestamptz not null default now(),
    unique(user_id, role_id)
);

-- ------------------------------------------------------------------------------
-- 4. SERVICES (TallGate Enterprise Offerings)
-- ------------------------------------------------------------------------------
create table if not exists services (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    title text not null,
    short_description text not null,
    full_description text not null,
    icon_name text,
    deliverables jsonb not null default '[]'::jsonb,
    target_audience text,
    is_active boolean not null default true,
    display_order int not null default 0,
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 5. CONSULTATION_REQUESTS (Business Inquiries & Scoping)
-- ------------------------------------------------------------------------------
create table if not exists consultation_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete set null,
    full_name text not null,
    email text not null,
    phone text not null,
    company_name text,
    service_interest text not null,
    project_scope text not null,
    budget_range text not null,
    timeline text not null,
    status text not null default 'pending' check (status in ('pending', 'contacted', 'in_progress', 'closed')),
    admin_notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 6. SERVICE_INQUIRIES (Direct Service Lead Intake)
-- ------------------------------------------------------------------------------
create table if not exists service_inquiries (
    id uuid primary key default gen_random_uuid(),
    service_id uuid references services(id) on delete set null,
    full_name text not null,
    email text not null,
    phone text not null,
    company_name text,
    message text not null,
    status text not null default 'new' check (status in ('new', 'reviewed', 'converted', 'archived')),
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 7. COURSES (Learning Hub)
-- ------------------------------------------------------------------------------
create table if not exists courses (
    id uuid primary key default gen_random_uuid(),
    slug text unique not null,
    title text not null,
    category text not null,
    level text not null default 'Beginner',
    price_ngn numeric not null default 0,
    duration text not null,
    short_description text not null,
    overview text not null,
    learning_outcomes jsonb not null default '[]'::jsonb,
    prerequisites text,
    is_popular boolean not null default false,
    is_published boolean not null default true,
    display_order int not null default 0,
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 8. COURSE_MODULES
-- ------------------------------------------------------------------------------
create table if not exists course_modules (
    id uuid primary key default gen_random_uuid(),
    course_id uuid not null references courses(id) on delete cascade,
    title text not null,
    order_index int not null default 0,
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 9. LESSONS
-- ------------------------------------------------------------------------------
create table if not exists lessons (
    id uuid primary key default gen_random_uuid(),
    module_id uuid not null references course_modules(id) on delete cascade,
    title text not null,
    content_type text not null default 'text' check (content_type in ('video', 'text')),
    content_markdown text,
    duration_minutes int not null default 30,
    order_index int not null default 0,
    is_preview boolean not null default false,
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 10. COURSE_ENROLLMENTS
-- ------------------------------------------------------------------------------
create table if not exists course_enrollments (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references profiles(id) on delete cascade,
    course_id uuid not null references courses(id) on delete cascade,
    status text not null default 'active' check (status in ('active', 'completed', 'dropped')),
    progress_percent int not null default 0 check (progress_percent >= 0 and progress_percent <= 100),
    enrolled_at timestamptz not null default now(),
    completed_at timestamptz,
    unique(user_id, course_id)
);

-- ------------------------------------------------------------------------------
-- 11. CERTIFICATES (Publicly Verifiable Credentials)
-- ------------------------------------------------------------------------------
create table if not exists certificates (
    id uuid primary key default gen_random_uuid(),
    verification_code text unique not null,
    user_id uuid not null references profiles(id) on delete cascade,
    course_id uuid not null references courses(id) on delete cascade,
    recipient_name text not null,
    course_title text not null,
    issue_date date not null default current_date,
    grade text default 'Distinction',
    is_valid boolean not null default true,
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 12. STARTUP_APPLICATIONS (Startup Hub Incubation/Support)
-- ------------------------------------------------------------------------------
create table if not exists startup_applications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references profiles(id) on delete set null,
    company_name text not null,
    founder_name text not null,
    email text not null,
    phone text not null,
    industry text not null,
    stage text not null check (stage in ('idea', 'prototype', 'mvp', 'early_revenue', 'scaling')),
    problem_statement text not null,
    solution_description text not null,
    pitch_deck_url text,
    support_needed jsonb not null default '[]'::jsonb,
    status text not null default 'submitted' check (status in ('submitted', 'under_review', 'accepted', 'waitlisted', 'declined')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 13. STARTUP_REVIEWS
-- ------------------------------------------------------------------------------
create table if not exists startup_reviews (
    id uuid primary key default gen_random_uuid(),
    application_id uuid not null references startup_applications(id) on delete cascade,
    reviewer_id uuid not null references profiles(id) on delete cascade,
    score int check (score >= 1 and score <= 10),
    comments text not null,
    recommendation text check (recommendation in ('accept', 'interview', 'decline', 'request_more_info')),
    created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------------------
-- 14. CONTACT_MESSAGES (General Inquiries)
-- ------------------------------------------------------------------------------
create table if not exists contact_messages (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text not null,
    phone text,
    subject text not null,
    message text not null,
    status text not null default 'unread' check (status in ('unread', 'read', 'responded', 'archived')),
    created_at timestamptz not null default now()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
create index if not exists idx_user_roles_user_id on user_roles(user_id);
create index if not exists idx_consultation_status on consultation_requests(status);
create index if not exists idx_courses_category on courses(category);
create index if not exists idx_courses_slug on courses(slug);
create index if not exists idx_enrollments_user_id on course_enrollments(user_id);
create index if not exists idx_certificates_code on certificates(verification_code);
create index if not exists idx_startup_applications_status on startup_applications(status);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
alter table profiles enable row level security;
alter table roles enable row level security;
alter table user_roles enable row level security;
alter table services enable row level security;
alter table consultation_requests enable row level security;
alter table service_inquiries enable row level security;
alter table courses enable row level security;
alter table course_modules enable row level security;
alter table lessons enable row level security;
alter table course_enrollments enable row level security;
alter table certificates enable row level security;
alter table startup_applications enable row level security;
alter table startup_reviews enable row level security;
alter table contact_messages enable row level security;

-- Helper Function to Check Admin Role
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_roles
    join public.roles on roles.id = user_roles.role_id
    where user_roles.user_id = (select auth.uid())
      and roles.name = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- PROFILES Policies
create policy "Users and admins can view profiles" on profiles
  for select to authenticated
  using (auth.uid() = id or public.is_admin());
create policy "Users can update own profile" on profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Authenticated users can read roles" on roles
  for select to authenticated using (true);

create policy "Users and admins can read user roles" on user_roles
  for select to authenticated
  using (auth.uid() = user_id or public.is_admin());

-- SERVICES Policies
create policy "Services are viewable by everyone" on services
  for select using (is_active = true or public.is_admin());
create policy "Admins can modify services" on services
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- CONSULTATION_REQUESTS Policies
create policy "Anyone can insert consultation requests" on consultation_requests
  for insert with check (true);
create policy "Users can view own consultation requests" on consultation_requests
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Admins can update consultation requests" on consultation_requests
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- SERVICE_INQUIRIES Policies
create policy "Anyone can insert service inquiries" on service_inquiries
  for insert with check (true);
create policy "Admins can view and manage service inquiries" on service_inquiries
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- COURSES, MODULES & LESSONS Policies
create policy "Published courses are viewable by everyone" on courses
  for select using (is_published = true or public.is_admin());
create policy "Course modules viewable by everyone" on course_modules
  for select using (true);
create policy "Lessons viewable by enrolled users or preview or admin" on lessons
  for select using (
    is_preview = true or 
    public.is_admin() or
    exists (
      select 1 from course_enrollments ce
      join course_modules cm on cm.course_id = ce.course_id
      where cm.id = lessons.module_id and ce.user_id = auth.uid()
    )
  );

-- COURSE_ENROLLMENTS Policies
create policy "Users can view own enrollments" on course_enrollments
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Users can insert own enrollment" on course_enrollments
  for insert to authenticated
  with check (auth.uid() = user_id and status = 'active');

-- CERTIFICATES Policies
create policy "Certificates are publicly verifiable" on certificates
  for select to anon using (true);
create policy "Admins can manage certificates" on certificates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- STARTUP_APPLICATIONS Policies
create policy "Anyone can submit a startup application" on startup_applications
  for insert with check (true);
create policy "Users can view own startup applications" on startup_applications
  for select using (auth.uid() = user_id or public.is_admin());
create policy "Admins can manage startup applications" on startup_applications
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- CONTACT_MESSAGES Policies
create policy "Anyone can insert contact messages" on contact_messages
  for insert with check (true);
create policy "Admins can view and manage contact messages" on contact_messages
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ==============================================================================
-- AUTOMATIC PROFILE TRIGGER ON SIGNUP
-- ==============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  default_role_id uuid;
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  -- Assign 'learner' default role
  select roles.id into default_role_id
  from public.roles
  where roles.name = 'learner'
  limit 1;
  if default_role_id is not null then
    insert into public.user_roles (user_id, role_id) values (new.id, default_role_id);
  end if;

  return new;
end;
$$;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ==============================================================================
-- SEED DEFAULT SYSTEM ROLES
-- ==============================================================================
insert into roles (name, description)
values 
  ('learner', 'Student accessing courses and certifications'),
  ('instructor', 'Course instructor managing lessons and assessments'),
  ('startup_founder', 'Founder participating in the Startup Hub'),
  ('business_owner', 'Client engaging consulting and enterprise services'),
  ('admin', 'Platform administrator with full governance access')
on conflict (name) do nothing;
