-- Forward-only: distinguish course-linked certificates from independent
-- manual certificates and persist the administrator's stated issuance reason.
--
-- Course-linked certificates are only minted after server-side verification of
-- course completion. Independent manual certificates have no course_id and
-- require an explicit reason; that reason is stored here and mirrored into
-- admin_audit_log.details for the audit trail.
--
-- Legacy rows are backfilled before the NOT NULL/check constraints are added:
--   * course_id IS NOT NULL -> course_linked
--   * course_id IS NULL     -> independent (reason remains NULL for legacy rows)

alter table public.certificates
  add column if not exists certificate_type text;

alter table public.certificates
  add column if not exists issuance_reason text;

update public.certificates
set certificate_type = case
  when course_id is null then 'independent'
  else 'course_linked'
end
where certificate_type is null;

alter table public.certificates
  alter column certificate_type set default 'course_linked';

alter table public.certificates
  alter column certificate_type set not null;

alter table public.certificates
  drop constraint if exists certificates_type_context_check;

alter table public.certificates
  add constraint certificates_type_context_check
  check (
    (certificate_type = 'course_linked' and course_id is not null)
    or (certificate_type = 'independent' and course_id is null)
  );

alter table public.certificates
  drop constraint if exists certificates_issuance_reason_length_check;

alter table public.certificates
  add constraint certificates_issuance_reason_length_check
  check (issuance_reason is null or char_length(issuance_reason) between 1 and 500);

comment on column public.certificates.certificate_type is
  'course_linked requires verified course completion; independent is a manual award with no course_id.';

comment on column public.certificates.issuance_reason is
  'Administrator-supplied reason for independent manual issuance. NULL for course-linked certificates.';

create index if not exists certificates_certificate_type_idx
  on public.certificates (certificate_type);
