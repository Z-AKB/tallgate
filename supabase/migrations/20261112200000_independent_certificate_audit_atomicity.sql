-- Forward-only hardening for independent manual certificates.
--
-- 20261112180000 is already applied to the disposable validation project. It
-- intentionally left reasonless legacy independent rows valid, so this migration
-- marks those pre-existing rows as exceptions and rejects that exception on all
-- future inserts. New independent certificates must therefore carry a trimmed,
-- 1..500 character reason, while legitimate legacy data remains readable.

alter table public.certificates
  add column if not exists issuance_reason_legacy_exempt boolean not null default false;

update public.certificates
set issuance_reason_legacy_exempt = true
where certificate_type = 'independent'
  and nullif(btrim(issuance_reason), '') is null;

alter table public.certificates
  drop constraint if exists certificates_issuance_reason_length_check;

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
        (issuance_reason_legacy_exempt = false
          and char_length(btrim(issuance_reason)) between 1 and 500)
        or issuance_reason_legacy_exempt = true
      ))
  );

create or replace function public.reject_new_certificate_reason_legacy_exempt()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.issuance_reason_legacy_exempt then
    raise exception 'issuance_reason_legacy_exempt is reserved for migrated legacy records'
      using errcode = '23514';
  end if;

  if tg_op = 'UPDATE'
    and new.issuance_reason_legacy_exempt
    and not old.issuance_reason_legacy_exempt then
    raise exception 'issuance_reason_legacy_exempt cannot be enabled after migration'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists certificates_reject_new_reason_legacy_exempt on public.certificates;
create trigger certificates_reject_new_reason_legacy_exempt
  before insert or update on public.certificates
  for each row execute function public.reject_new_certificate_reason_legacy_exempt();

comment on column public.certificates.issuance_reason_legacy_exempt is
  'True only for pre-20261112200000 independent rows without a recorded reason.';

-- The certificate row and its mandatory independent-manual-issuance audit row
-- are inserted in the same database transaction. A retry first locks and
-- returns the existing certificate, and only creates an audit row if none was
-- committed with it (for a pre-existing legacy row). This makes retries
-- idempotent and prevents duplicate success audit entries.
create or replace function public.issue_independent_certificate_with_audit(
  p_actor_id uuid,
  p_user_id uuid,
  p_recipient_name text,
  p_course_title text,
  p_issuance_reason text,
  p_grade text,
  p_issue_date date,
  p_verification_code text
)
returns public.certificates
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_certificate public.certificates;
  v_reason text := btrim(p_issuance_reason);
begin
  if p_actor_id is null or p_user_id is null or nullif(btrim(p_recipient_name), '') is null
    or nullif(btrim(p_course_title), '') is null or p_issue_date is null
    or nullif(btrim(p_verification_code), '') is null then
    raise exception 'Independent certificate audit inputs are required' using errcode = '22023';
  end if;

  if char_length(v_reason) not between 1 and 500 then
    raise exception 'Independent certificate reason must be 1 to 500 non-whitespace characters'
      using errcode = '23514';
  end if;

  select * into v_certificate
  from public.certificates
  where user_id = p_user_id
    and course_id is null
    and course_title = btrim(p_course_title)
    and issue_date = p_issue_date
  for update;

  if not found then
    insert into public.certificates (
      recipient_name, user_id, course_id, course_title, certificate_type,
      issuance_reason, issuance_reason_legacy_exempt, grade, issue_date,
      is_valid, verification_code, email_status, email_retry_count
    ) values (
      btrim(p_recipient_name), p_user_id, null, btrim(p_course_title), 'independent',
      v_reason, false, p_grade, p_issue_date, true, btrim(p_verification_code),
      'pending', 0
    ) returning * into v_certificate;
  end if;

  if not exists (
    select 1 from public.admin_audit_log
    where action = 'issue_certificate'
      and outcome = 'success'
      and target = v_certificate.id::text
      and details ->> 'certificate_type' = 'independent'
  ) then
    insert into public.admin_audit_log (actor_id, action, target, outcome, details)
    values (
      p_actor_id,
      'issue_certificate',
      v_certificate.id::text,
      'success',
      jsonb_build_object(
        'certificate_type', 'independent',
        'issuing_admin_id', p_actor_id,
        'recipient_user_id', p_user_id,
        'course_id', null,
        'issue_date', p_issue_date,
        'reason', v_certificate.issuance_reason,
        'issuance_status', 'created'
      )
    );
  end if;

  return v_certificate;
end;
$$;

-- This is only callable with the service role. The API authorizes the caller
-- before using its service-role client; untrusted roles cannot mint an audited
-- manual award by invoking the RPC directly.
revoke all on function public.issue_independent_certificate_with_audit(uuid, uuid, text, text, text, text, date, text) from public;
revoke all on function public.issue_independent_certificate_with_audit(uuid, uuid, text, text, text, text, date, text) from anon;
revoke all on function public.issue_independent_certificate_with_audit(uuid, uuid, text, text, text, text, date, text) from authenticated;
grant execute on function public.issue_independent_certificate_with_audit(uuid, uuid, text, text, text, text, date, text) to service_role;
