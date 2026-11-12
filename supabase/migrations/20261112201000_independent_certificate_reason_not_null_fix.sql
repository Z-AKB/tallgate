-- Forward-only correction: CHECK expressions pass on NULL, so explicitly
-- require a non-NULL reason for all non-legacy independent certificates.

alter table public.certificates
  drop constraint if exists certificates_issuance_reason_context_check;

alter table public.certificates
  add constraint certificates_issuance_reason_context_check
  check (
    (certificate_type = 'course_linked'
      and course_id is not null
      and issuance_reason is null
      and issuance_reason_legacy_exempt = false)
    or
    (certificate_type = 'independent'
      and course_id is null
      and (
        issuance_reason_legacy_exempt = true
        or (
          issuance_reason_legacy_exempt = false
          and issuance_reason is not null
          and char_length(btrim(issuance_reason)) between 1 and 500
        )
      ))
  );
