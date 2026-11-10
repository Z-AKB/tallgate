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
-- end, so even a mistaken run leaves no rows behind -- it must still never
-- be pointed at staging or production.
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
SET request.jwt.claims = '{"role":"service_role","sub":"00000000-0000-0000-0000-000000000000"}';

-- Fixture rows (rolled back with the transaction).
INSERT INTO public.certificates (id, verification_code, recipient_name, course_title, email_status, email_retry_count)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'VAL-NULL-A', 'Validation A', 'Validation Course A', 'pending', 0),
  ('22222222-2222-2222-2222-222222222222', 'VAL-NULL-B', 'Validation B', 'Validation Course B', 'pending', 0),
  ('33333333-3333-3333-3333-333333333333', 'VAL-NULL-C', 'Validation C', 'Validation Course C', 'pending', 0);

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
