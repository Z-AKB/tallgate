-- Certificate email RPC NULL-status validation checks
-- =====================================================
--
-- NOT a migration. The Supabase CLI only auto-applies files under
-- supabase/migrations/, so this file is never applied automatically. It is
-- a manual validation script for the NULL-safe status checks introduced by
-- migration 20261110180000 and must be run against a DISPOSABLE database
-- that has all migrations through 20261110180000 applied:
--
--   psql "<disposable-db-url>" \
--     -f supabase/validate/20261110180000_certificate_email_rpc_null_validation.sql
--
-- The whole script runs inside a transaction that is rolled back at the
-- end, so it leaves no rows behind -- it must still never be pointed at
-- staging or production.
--
-- Fixtures: three certificates exercise the RPC matrix. certificates.user_id
-- references public.profiles(id) and certificates.course_id references
-- public.courses(id); public.profiles.id itself references auth.users(id).
-- The script therefore creates its own temporary dependency chain inside
-- the same transaction:
--
--   auth.users  ->  public.profiles  ->  public.certificates.user_id
--   public.courses  ->  public.certificates.course_id
--
-- No fabricated foreign keys are used and no existing rows are modified:
-- every referenced row is inserted (and rolled back) by this script. The
-- certificates use one shared user_id with distinct course_ids, which also
-- satisfies the partial unique index certificates_user_course_unique on
-- (user_id, course_id) WHERE course_id IS NOT NULL.
--
-- Prerequisites, verified by the preflight block with explicit diagnostics:
--   * tables public.certificates, public.profiles, public.courses, auth.users
--   * the email RPC functions with their 20261110180000 signatures
--   * INSERT/SELECT privileges for the connected role. Connect as the
--     database owner or the postgres superuser: RLS is enabled on these
--     tables and non-exempt roles are subject to it.
--
-- Cases covered (mirrors the review matrix):
--   update_certificate_email_status:
--     1. set flag TRUE + status NULL   -> rejected
--     2. set flag TRUE + valid status  -> accepted, status applied
--     3. set flag FALSE + status NULL  -> accepted, status unchanged
--   complete_certificate_email_lease:
--     4. status NULL                   -> rejected
--     5. status 'sent' + owning token  -> accepted, lease cleared
--     6. status 'failed' + owning token -> accepted, error recorded
--     7. invalid status                -> rejected
--     8. wrong lease token             -> no update, lease kept
--
-- A case FAILS the script when the function returns success it should not
-- have (or raises an unexpected exception). The script aborts on the first
-- failure (ON_ERROR_STOP) and prints one NOTICE line per passed case.

\set ON_ERROR_STOP on

BEGIN;

-- Simulate the PostgREST service role. PostgREST sets this GUC from the
-- verified service-role JWT after authentication; the RPC authorization
-- checks (is_admin() OR is_service_role()) read it. The dummy sub has no
-- user_roles rows, so authorization must pass via the service-role branch.
SET LOCAL request.jwt.claims = '{"role":"service_role","sub":"00000000-0000-0000-0000-000000000000"}';

-- ---------------------------------------------------------------------------
-- Preflight: fail with a clear diagnostic when prerequisites are missing
-- ---------------------------------------------------------------------------

DO $preflight$
BEGIN
  IF pg_catalog.to_regclass('public.certificates') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE MISSING: table public.certificates not found. Apply the schema migrations to this database first.';
  END IF;
  IF pg_catalog.to_regclass('public.profiles') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE MISSING: table public.profiles not found. Apply the schema migrations to this database first.';
  END IF;
  IF pg_catalog.to_regclass('public.courses') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE MISSING: table public.courses not found. Apply the schema migrations to this database first.';
  END IF;
  IF pg_catalog.to_regclass('auth.users') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE MISSING: table auth.users not found. This script must run against a Supabase database (public.profiles.id references auth.users).';
  END IF;

  IF pg_catalog.to_regprocedure('public.update_certificate_email_status(uuid, text, boolean, timestamptz, boolean, uuid, boolean, timestamptz, boolean, text, boolean, int, boolean)') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE MISSING: function public.update_certificate_email_status(uuid, text, boolean, timestamptz, boolean, uuid, boolean, timestamptz, boolean, text, boolean, int, boolean) not found. Apply migrations through 20261110180000_certificate_email_rpc_null_status_validation first.';
  END IF;
  IF pg_catalog.to_regprocedure('public.claim_certificate_email_lease(uuid, uuid, interval)') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE MISSING: function public.claim_certificate_email_lease(uuid, uuid, interval) not found. Apply migrations through 20261110180000_certificate_email_rpc_null_status_validation first.';
  END IF;
  IF pg_catalog.to_regprocedure('public.complete_certificate_email_lease(uuid, uuid, text, text)') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE MISSING: function public.complete_certificate_email_lease(uuid, uuid, text, text) not found. Apply migrations through 20261110180000_certificate_email_rpc_null_status_validation first.';
  END IF;
  IF pg_catalog.to_regprocedure('public.is_service_role()') IS NULL OR pg_catalog.to_regprocedure('public.is_admin()') IS NULL THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE MISSING: function public.is_service_role() or public.is_admin() not found. Apply migrations through 20261110180000_certificate_email_rpc_null_status_validation first.';
  END IF;

  IF NOT pg_catalog.has_table_privilege(pg_catalog.current_user, 'public.certificates', 'INSERT, SELECT') THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE FAILED: role % lacks INSERT/SELECT on public.certificates. Connect as the database owner or the postgres superuser (RLS is enabled on this table).', pg_catalog.current_user;
  END IF;
  IF NOT pg_catalog.has_table_privilege(pg_catalog.current_user, 'public.profiles', 'INSERT') THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE FAILED: role % lacks INSERT on public.profiles. Connect as the database owner or the postgres superuser (RLS is enabled on this table).', pg_catalog.current_user;
  END IF;
  IF NOT pg_catalog.has_table_privilege(pg_catalog.current_user, 'public.courses', 'INSERT') THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE FAILED: role % lacks INSERT on public.courses. Connect as the database owner or the postgres superuser (RLS is enabled on this table).', pg_catalog.current_user;
  END IF;
  IF NOT pg_catalog.has_table_privilege(pg_catalog.current_user, 'auth.users', 'INSERT') THEN
    RAISE EXCEPTION 'VALIDATION PREREQUISITE FAILED: role % lacks INSERT on auth.users. Connect as the database owner or the postgres superuser.', pg_catalog.current_user;
  END IF;

  RAISE NOTICE 'preflight passed: required tables, functions, and privileges are present';
END
$preflight$;

-- ---------------------------------------------------------------------------
-- Fixtures (rolled back with the transaction)
-- ---------------------------------------------------------------------------

DO $fixtures$
DECLARE
  v_message text;
BEGIN
  -- Root of the dependency chain: public.profiles.id references auth.users.id.
  BEGIN
    INSERT INTO auth.users (id, email)
    VALUES ('66666666-6666-6666-6666-666666666666', 'validation-null-status@example.invalid');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    RAISE EXCEPTION 'VALIDATION SETUP FAILED: could not insert the auth.users fixture: %', v_message;
  END;

  BEGIN
    INSERT INTO public.profiles (id, full_name, email)
    VALUES ('66666666-6666-6666-6666-666666666666', 'Validation RPC Fixtures', 'validation-null-status@example.invalid');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    RAISE EXCEPTION 'VALIDATION SETUP FAILED: could not insert the public.profiles fixture (its id must match a row in auth.users): %', v_message;
  END;

  -- Three distinct courses so the three certificates form distinct
  -- (user_id, course_id) pairs under certificates_user_course_unique.
  BEGIN
    INSERT INTO public.courses (id, slug, title, category, duration, short_description, overview)
    VALUES
      ('77777777-7777-7777-7777-777777777771', 'validation-null-status-a', 'Validation Course A', 'Validation', '1 hour', 'Validation fixture course A', 'Validation fixture course A overview.'),
      ('77777777-7777-7777-7777-777777777772', 'validation-null-status-b', 'Validation Course B', 'Validation', '1 hour', 'Validation fixture course B', 'Validation fixture course B overview.'),
      ('77777777-7777-7777-7777-777777777773', 'validation-null-status-c', 'Validation Course C', 'Validation', '1 hour', 'Validation fixture course C', 'Validation fixture course C overview.');
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    RAISE EXCEPTION 'VALIDATION SETUP FAILED: could not insert the public.courses fixtures: %', v_message;
  END;

  BEGIN
    INSERT INTO public.certificates (id, verification_code, user_id, course_id, recipient_name, course_title, email_status, email_retry_count)
    VALUES
      ('11111111-1111-1111-1111-111111111111', 'VAL-NULL-A', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777771', 'Validation A', 'Validation Course A', 'pending', 0),
      ('22222222-2222-2222-2222-222222222222', 'VAL-NULL-B', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777772', 'Validation B', 'Validation Course B', 'pending', 0),
      ('33333333-3333-3333-3333-333333333333', 'VAL-NULL-C', '66666666-6666-6666-6666-666666666666', '77777777-7777-7777-7777-777777777773', 'Validation C', 'Validation Course C', 'pending', 0);
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    RAISE EXCEPTION 'VALIDATION SETUP FAILED: could not insert the public.certificates fixtures (user_id/course_id must reference the fixture rows above; RLS may block non-owner roles): %', v_message;
  END;

  RAISE NOTICE 'fixtures inserted: 1 auth user, 1 profile, 3 courses, 3 certificates';
END
$fixtures$;

-- ---------------------------------------------------------------------------
-- Validation cases
-- ---------------------------------------------------------------------------

DO $validate$
DECLARE
  v_result boolean;
  v_status text;
  v_token uuid;
  v_sent_at timestamptz;
  v_error text;
  v_retry_count int;
  v_message text;
  v_lease_token uuid := '44444444-4444-4444-4444-444444444444';
  v_wrong_token uuid := '55555555-5555-5555-5555-555555555555';
BEGIN
  -- ------------------------------------------------------------------
  -- Case 1: update_certificate_email_status(flag TRUE, status NULL)
  -- Expected: rejected.
  -- ------------------------------------------------------------------
  BEGIN
    SELECT public.update_certificate_email_status('11111111-1111-1111-1111-111111111111', NULL, true) INTO v_result;
    RAISE EXCEPTION 'VALIDATION FAILED (case 1): NULL status with set flag was accepted';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    IF v_message LIKE 'VALIDATION FAILED%' THEN
      RAISE;
    END IF;
    IF v_message !~* 'email status' THEN
      RAISE EXCEPTION 'VALIDATION FAILED (case 1): unexpected exception: %', v_message;
    END IF;
  END;
  RAISE NOTICE 'case 1 passed: NULL status with set flag rejected';

  -- ------------------------------------------------------------------
  -- Case 2: update_certificate_email_status(flag TRUE, 'sent')
  -- Expected: accepted and applied.
  -- ------------------------------------------------------------------
  SELECT public.update_certificate_email_status('11111111-1111-1111-1111-111111111111', 'sent', true) INTO v_result;
  IF v_result IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 2): valid status was not accepted';
  END IF;
  SELECT email_status INTO v_status FROM public.certificates WHERE id = '11111111-1111-1111-1111-111111111111';
  IF v_status IS DISTINCT FROM 'sent' THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 2): status not applied, got %', v_status;
  END IF;
  RAISE NOTICE 'case 2 passed: valid status accepted and applied';

  -- ------------------------------------------------------------------
  -- Case 3: update_certificate_email_status(flag FALSE, status NULL)
  -- Expected: accepted, existing status unchanged.
  -- ------------------------------------------------------------------
  SELECT public.update_certificate_email_status('11111111-1111-1111-1111-111111111111', NULL, false) INTO v_result;
  IF v_result IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 3): flagless update failed';
  END IF;
  SELECT email_status INTO v_status FROM public.certificates WHERE id = '11111111-1111-1111-1111-111111111111';
  IF v_status IS DISTINCT FROM 'sent' THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 3): status changed unexpectedly to %', v_status;
  END IF;
  RAISE NOTICE 'case 3 passed: status left unchanged without the flag';

  -- ------------------------------------------------------------------
  -- Case 4: complete_certificate_email_lease(status NULL)
  -- Expected: rejected.
  -- ------------------------------------------------------------------
  BEGIN
    SELECT public.complete_certificate_email_lease('22222222-2222-2222-2222-222222222222', v_lease_token, NULL) INTO v_result;
    RAISE EXCEPTION 'VALIDATION FAILED (case 4): NULL status was accepted';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    IF v_message LIKE 'VALIDATION FAILED%' THEN
      RAISE;
    END IF;
    IF v_message !~* 'email status' THEN
      RAISE EXCEPTION 'VALIDATION FAILED (case 4): unexpected exception: %', v_message;
    END IF;
  END;
  RAISE NOTICE 'case 4 passed: NULL status rejected';

  -- ------------------------------------------------------------------
  -- Case 5: complete_certificate_email_lease('sent', owning token)
  -- Expected: accepted; status sent, lease cleared, sent_at set.
  -- ------------------------------------------------------------------
  PERFORM public.claim_certificate_email_lease('22222222-2222-2222-2222-222222222222', v_lease_token);
  SELECT public.complete_certificate_email_lease('22222222-2222-2222-2222-222222222222', v_lease_token, 'sent') INTO v_result;
  IF v_result IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 5): completing with the owning token failed';
  END IF;
  SELECT email_status, email_lease_token, email_sent_at INTO v_status, v_token, v_sent_at
    FROM public.certificates WHERE id = '22222222-2222-2222-2222-222222222222';
  IF v_status IS DISTINCT FROM 'sent' OR v_token IS NOT NULL OR v_sent_at IS NULL THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 5): got status %, token %, sent_at %', v_status, v_token, v_sent_at;
  END IF;
  RAISE NOTICE 'case 5 passed: sent with owning token accepted, lease cleared';

  -- ------------------------------------------------------------------
  -- Case 6: complete_certificate_email_lease('failed', owning token)
  -- Expected: accepted; status failed, error recorded, lease cleared.
  -- ------------------------------------------------------------------
  PERFORM public.claim_certificate_email_lease('33333333-3333-3333-3333-333333333333', v_lease_token);
  SELECT public.complete_certificate_email_lease('33333333-3333-3333-3333-333333333333', v_lease_token, 'failed', 'smtp rejected') INTO v_result;
  IF v_result IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 6): failing with the owning token was not accepted';
  END IF;
  SELECT email_status, email_lease_token, email_error, email_sent_at, email_retry_count
    INTO v_status, v_token, v_error, v_sent_at, v_retry_count
    FROM public.certificates WHERE id = '33333333-3333-3333-3333-333333333333';
  IF v_status IS DISTINCT FROM 'failed' OR v_token IS NOT NULL OR v_error IS DISTINCT FROM 'smtp rejected' OR v_sent_at IS NOT NULL OR v_retry_count IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 6): got status %, token %, error %, sent_at %, retry %', v_status, v_token, v_error, v_sent_at, v_retry_count;
  END IF;
  RAISE NOTICE 'case 6 passed: failed with owning token accepted, error recorded';

  -- ------------------------------------------------------------------
  -- Case 7: complete_certificate_email_lease(invalid status)
  -- Expected: rejected.
  -- ------------------------------------------------------------------
  BEGIN
    SELECT public.complete_certificate_email_lease('22222222-2222-2222-2222-222222222222', v_lease_token, 'bogus') INTO v_result;
    RAISE EXCEPTION 'VALIDATION FAILED (case 7): invalid status was accepted';
  EXCEPTION WHEN OTHERS THEN
    GET STACKED DIAGNOSTICS v_message = MESSAGE_TEXT;
    IF v_message LIKE 'VALIDATION FAILED%' THEN
      RAISE;
    END IF;
    IF v_message !~* 'email status' THEN
      RAISE EXCEPTION 'VALIDATION FAILED (case 7): unexpected exception: %', v_message;
    END IF;
  END;
  RAISE NOTICE 'case 7 passed: invalid status rejected';

  -- ------------------------------------------------------------------
  -- Case 8: complete_certificate_email_lease(wrong lease token)
  -- Expected: no update; certificate keeps its lease.
  -- ------------------------------------------------------------------
  -- Re-claim (possible from 'failed') to get an active lease again.
  PERFORM public.claim_certificate_email_lease('33333333-3333-3333-3333-333333333333', v_lease_token);
  SELECT public.complete_certificate_email_lease('33333333-3333-3333-3333-333333333333', v_wrong_token, 'sent') INTO v_result;
  IF v_result IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 8): wrong token completed the lease';
  END IF;
  SELECT email_status, email_lease_token INTO v_status, v_token
    FROM public.certificates WHERE id = '33333333-3333-3333-3333-333333333333';
  IF v_status IS DISTINCT FROM 'sending' OR v_token IS DISTINCT FROM v_lease_token THEN
    RAISE EXCEPTION 'VALIDATION FAILED (case 8): lease was altered (status %, token %)', v_status, v_token;
  END IF;
  RAISE NOTICE 'case 8 passed: wrong token made no update, lease kept';

  RAISE NOTICE 'All 8 certificate email RPC NULL-validation cases passed.';
END
$validate$;

ROLLBACK;
