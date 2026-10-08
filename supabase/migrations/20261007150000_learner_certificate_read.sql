-- Learners can read their own certificates in the portal. Public verification
-- still goes through verify_certificate(); this only widens row access for the
-- authenticated owner.

drop policy if exists "Users can view their own certificates" on public.certificates;
create policy "Users can view their own certificates"
  on public.certificates
  for select
  to authenticated
  using (user_id = (select auth.uid()));