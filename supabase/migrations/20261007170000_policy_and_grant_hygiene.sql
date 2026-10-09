-- Policy and grant hygiene.
--
-- 20261007000000_rate_limit_and_enrollment_hardening.sql revoked INSERT on the
-- public intake tables from client roles and re-granted it to service_role only.
-- The old permissive `for insert with check (true)` policies therefore do
-- nothing today, but would silently become an open write path again if client
-- INSERT were ever re-granted. Drop them so intent lives in RLS, not grants.

drop policy if exists "Anyone can insert consultation requests" on public.consultation_requests;
drop policy if exists "Anyone can insert service inquiries" on public.service_inquiries;
drop policy if exists "Anyone can submit a startup application" on public.startup_applications;
drop policy if exists "Anyone can insert contact messages" on public.contact_messages;

-- Certificate numbers are assigned by the sequence default during service-role
-- issuance; authenticated clients never need to read (currval/last_value) it.
revoke select on sequence public.certificate_number_seq from authenticated;
