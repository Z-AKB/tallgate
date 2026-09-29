create table public.user_roles (
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (
    role in ('visitor', 'learner', 'instructor', 'founder', 'admin')
  ),
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  email text not null check (length(trim(email)) > 0),
  phone text,
  inquiry_type text not null check (
    inquiry_type in ('consultation', 'business_inquiry', 'support')
  ),
  message text not null check (length(trim(message)) > 0),
  status text not null default 'new' check (
    status in ('new', 'in_progress', 'resolved')
  ),
  created_at timestamptz not null default now()
);

create table public.startup_applications (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references auth.users (id) on delete cascade,
  business_name text not null check (length(trim(business_name)) > 0),
  pitch_summary text not null check (length(trim(pitch_summary)) > 0),
  status text not null default 'submitted' check (
    status in ('submitted', 'under_review', 'approved', 'rejected')
  ),
  created_at timestamptz not null default now()
);

create index startup_applications_founder_created_idx
  on public.startup_applications (founder_id, created_at desc);

create index startup_applications_status_created_idx
  on public.startup_applications (status, created_at desc);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  certificate_number text not null unique,
  issued_at timestamptz not null default now()
);

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
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

alter table public.user_roles enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.startup_applications enable row level security;
alter table public.certificates enable row level security;

create policy "Users can read their own roles"
  on public.user_roles
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "Admins can manage roles"
  on public.user_roles
  for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Anyone can submit a new inquiry"
  on public.contact_inquiries
  for insert
  to anon, authenticated
  with check (status = 'new');

create policy "Admins can read inquiries"
  on public.contact_inquiries
  for select
  to authenticated
  using ((select public.is_admin()));

create policy "Users can submit their own startup application"
  on public.startup_applications
  for insert
  to authenticated
  with check (
    founder_id = (select auth.uid())
    and status = 'submitted'
  );

create policy "Users can read their own startup applications"
  on public.startup_applications
  for select
  to authenticated
  using (founder_id = (select auth.uid()));

create policy "Admins can read startup applications"
  on public.startup_applications
  for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can update startup applications"
  on public.startup_applications
  for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Certificates are publicly verifiable"
  on public.certificates
  for select
  to anon, authenticated
  using (true);

revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;

revoke all on public.contact_inquiries from anon, authenticated;
grant insert on public.contact_inquiries to anon, authenticated;
grant select on public.contact_inquiries to authenticated;

revoke all on public.startup_applications from anon, authenticated;
grant select, insert, update on public.startup_applications to authenticated;

revoke all on public.certificates from anon, authenticated;
grant select (id, certificate_number, issued_at)
  on public.certificates to anon, authenticated;
