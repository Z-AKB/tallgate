-- B1 hardening: storage buckets referenced by existing policies, and the
-- certificate table grants that the current RLS policies already assume.
--
-- 20260829000000_lesson_content_gating.sql creates storage.objects policies for
-- bucket_id = 'course-content', but no migration ever created that bucket, so
-- those policies could never match a real object. Create it here as private.
--
-- 20260930000000_certificate_registry.sql grants select/insert/update on
-- certificates to authenticated but the "Admins can read and manage
-- certificates" policy is `for all`, which includes delete. Without the DELETE
-- grant an admin delete silently fails. Grant it here.

insert into storage.buckets (id, name, public)
values ('course-content', 'course-content', false)
on conflict (id) do update set public = false;

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do update set public = false;

grant usage, select on sequence public.certificate_number_seq to authenticated;

grant select, insert, update, delete on public.certificates to authenticated;

-- Public verification surface stays column-scoped: anon may read a certificate
-- row but never storage_path, user_id, course_id, id or created_at.
revoke all on public.certificates from anon;
grant select (
  verification_code,
  certificate_number,
  recipient_name,
  course_title,
  issue_date,
  grade,
  is_valid
) on public.certificates to anon;