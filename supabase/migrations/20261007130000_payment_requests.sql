-- Administrative payment requests.
--
-- The platform has no payment gateway: enrolment intake (see /api/enrollments)
-- records a lead and the admin confirms payment manually. This table makes
-- that confirmation auditable. It intentionally stores no card data, no
-- tokens and no processor payloads - only what an admin records about an
-- offline transfer or cash payment.

create table if not exists public.payment_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (char_length(email) between 3 and 200),
  phone text check (phone is null or char_length(phone) <= 40),
  amount numeric(12, 2) not null check (amount >= 0),
  currency text not null default 'NGN' check (char_length(currency) <= 3),
  method text not null default 'bank_transfer'
    check (method in ('bank_transfer', 'card', 'cash', 'other')),
  reference text check (reference is null or char_length(reference) <= 120),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'declined', 'refunded')),
  note text check (note is null or char_length(note) <= 500),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payment_requests_status
  on public.payment_requests (status, created_at desc);
create index if not exists idx_payment_requests_user_id
  on public.payment_requests (user_id);

alter table public.payment_requests enable row level security;

revoke all on public.payment_requests from anon;
revoke all on public.payment_requests from authenticated;
grant select, insert, update on public.payment_requests to authenticated;

drop policy if exists "Users can read own payment requests" on public.payment_requests;
create policy "Users can read own payment requests"
  on public.payment_requests
  for select
  to authenticated
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Admins can create payment requests" on public.payment_requests;
create policy "Admins can create payment requests"
  on public.payment_requests
  for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "Admins can manage payment requests" on public.payment_requests;
create policy "Admins can manage payment requests"
  on public.payment_requests
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());
