-- Public verification is available only through an exact-code lookup.
-- Anonymous PostgREST clients cannot select certificate rows or enumerate
-- verification codes.

drop policy if exists "Certificates are publicly verifiable"
  on public.certificates;
drop policy if exists "Anonymous visitors can verify public certificate details"
  on public.certificates;

revoke all privileges on table public.certificates from public, anon;
revoke select (
  verification_code,
  certificate_number,
  recipient_name,
  course_title,
  issue_date,
  grade,
  is_valid
) on table public.certificates from public, anon;

create or replace function public.verify_certificate(p_verification_code text)
returns table (
  certificate_number text,
  course_title text,
  issue_date date,
  is_valid boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    certificate.certificate_number,
    certificate.course_title,
    certificate.issue_date,
    certificate.is_valid
  from public.certificates as certificate
  where p_verification_code ~ '^[A-Z0-9-]{4,64}$'
    and certificate.verification_code = p_verification_code
  limit 1;
$$;

revoke all privileges
  on function public.verify_certificate(text)
  from public, anon, authenticated;
grant execute
  on function public.verify_certificate(text)
  to anon;
