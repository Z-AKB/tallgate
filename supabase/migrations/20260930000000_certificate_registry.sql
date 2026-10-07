alter table public.certificates
  add column certificate_number text;

create sequence public.certificate_number_seq
  start with 1021
  increment by 1
  no minvalue
  no maxvalue
  cache 1;

update public.certificates
set certificate_number =
  'TG/DH/' ||
  lpad(nextval('public.certificate_number_seq')::text, 5, '0') ||
  '/' ||
  to_char(issue_date, 'YY')
where certificate_number is null;

alter table public.certificates
  alter column certificate_number
  set default (
    'TG/DH/' ||
    lpad(nextval('public.certificate_number_seq')::text, 5, '0') ||
    '/' ||
    to_char(current_date, 'YY')
  );

alter table public.certificates
  alter column certificate_number set not null;

alter table public.certificates
  add constraint certificates_certificate_number_key
  unique (certificate_number);

alter table public.certificates
  alter column course_id drop not null;

alter table public.certificates
  alter column user_id drop not null;

grant usage, select on sequence public.certificate_number_seq to authenticated;

drop index if exists public.idx_certificates_code;

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

drop policy if exists "Certificates are publicly verifiable"
  on public.certificates;

create policy "Anonymous visitors can verify public certificate details"
  on public.certificates
  for select
  to anon
  using (true);

drop policy if exists "Admins can manage certificates"
  on public.certificates;

create policy "Admins can read and manage certificates"
  on public.certificates
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on public.certificates from anon, authenticated;
grant select (
  verification_code,
  certificate_number,
  recipient_name,
  course_title,
  issue_date,
  grade,
  is_valid
) on public.certificates to anon;
grant select, insert, update on public.certificates to authenticated;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;
