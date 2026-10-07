-- B2: certificate PDF storage.
--
-- 20261002000000_certificate_storage_path.sql adds storage_path and the private
-- certificates bucket, but that file is not committed and no storage.objects
-- policy was ever created for the bucket, so nothing could be written to or
-- read from it. Both are declared idempotently here so this migration is
-- sufficient on its own regardless of whether 20261002000000 was applied.
--
-- Certificate PDFs are served through short-lived signed URLs from an
-- admin-only route handler (service-role client), so these policies are the
-- defence-in-depth layer for any direct storage access.

alter table public.certificates
  add column if not exists storage_path text;

insert into storage.buckets (id, name, public)
values ('certificates', 'certificates', false)
on conflict (id) do update set public = false;

-- Admin upload. Object names are unguessable tokens, and admins are the only
-- role that mints certificates.
create policy "Admins can upload certificate files"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'certificates' and public.is_admin());

-- Admin read. No anon or learner access to the bucket at all.
create policy "Admins can read certificate files"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'certificates' and public.is_admin());

create policy "Admins can replace certificate files"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'certificates' and public.is_admin())
  with check (bucket_id = 'certificates' and public.is_admin());

create policy "Admins can delete certificate files"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'certificates' and public.is_admin());