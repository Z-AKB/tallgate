-- Certificate email RPC NULL status validation fix (follow-up to 20261110170000)
--
-- Two NULL-safety defects in the status validation of the certificate email
-- RPCs are corrected here. `value NOT IN (...)` evaluates to NULL (not TRUE)
-- when the value is NULL, so PostgreSQL did not enter either IF block:
--
--   1. update_certificate_email_status(flag TRUE, status NULL) skipped its
--      validation and then wrote email_status = NULL. The column CHECK
--      constraint (email_status IN ('pending','sending','sent','failed'))
--      does not reject NULL either, so the NULL persisted in the database.
--   2. complete_certificate_email_lease(status NULL) skipped its validation
--      and then completed the lease: the token was cleared, retry_count
--      incremented, and email_status set to NULL.
--
-- Both functions now reject a NULL status explicitly. Everything else --
-- signatures, authorization checks, lease-token ownership checks, NULL
-- value-plus-flag clearing contract for the other fields, SECURITY DEFINER,
-- empty search_path, and EXECUTE grants -- is preserved exactly as created
-- by 20261110170000.
--
-- This migration must run after 20261110170000 (Supabase applies migrations
-- in filename order, which guarantees this). Only the two affected
-- functions are recreated; claim_certificate_email_lease,
-- release_stale_certificate_email_leases, is_service_role, table grants,
-- RLS policies, and all other certificate logic are unchanged.

-- ---------------------------------------------------------------------------
-- 1. update_certificate_email_status
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.update_certificate_email_status(uuid, text, boolean, timestamptz, boolean, uuid, boolean, timestamptz, boolean, text, boolean, int, boolean);

-- Column/value pairs: a column is updated only when its p_set_* flag is
-- true; passing the value without the flag leaves the column unchanged,
-- while flag + NULL explicitly clears it. The status column is the
-- exception: a NULL status is never valid, so flag + NULL is rejected.
CREATE OR REPLACE FUNCTION public.update_certificate_email_status(
  p_certificate_id uuid,
  p_email_status text DEFAULT NULL,
  p_set_email_status boolean DEFAULT false,
  p_email_sent_at timestamptz DEFAULT NULL,
  p_set_email_sent_at boolean DEFAULT false,
  p_email_lease_token uuid DEFAULT NULL,
  p_set_email_lease_token boolean DEFAULT false,
  p_email_lease_acquired_at timestamptz DEFAULT NULL,
  p_set_email_lease_acquired_at boolean DEFAULT false,
  p_email_error text DEFAULT NULL,
  p_set_email_error boolean DEFAULT false,
  p_email_retry_count int DEFAULT NULL,
  p_set_email_retry_count boolean DEFAULT false
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Only administrators can update certificate email status';
  END IF;

  -- NULL-safe validation: the IS NULL test must come first because
  -- `NULL NOT IN (...)` evaluates to NULL, which previously let a NULL
  -- status bypass this check.
  IF p_set_email_status AND (p_email_status IS NULL OR p_email_status NOT IN ('pending', 'sending', 'sent', 'failed')) THEN
    RAISE EXCEPTION 'Email status must be one of pending, sending, sent, failed';
  END IF;

  UPDATE public.certificates
  SET
    email_status = CASE WHEN p_set_email_status THEN p_email_status ELSE email_status END,
    email_sent_at = CASE WHEN p_set_email_sent_at THEN p_email_sent_at ELSE email_sent_at END,
    email_lease_token = CASE WHEN p_set_email_lease_token THEN p_email_lease_token ELSE email_lease_token END,
    email_lease_acquired_at = CASE WHEN p_set_email_lease_acquired_at THEN p_email_lease_acquired_at ELSE email_lease_acquired_at END,
    email_error = CASE WHEN p_set_email_error THEN p_email_error ELSE email_error END,
    email_retry_count = CASE WHEN p_set_email_retry_count THEN p_email_retry_count ELSE email_retry_count END
  WHERE id = p_certificate_id;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.update_certificate_email_status(uuid, text, boolean, timestamptz, boolean, uuid, boolean, timestamptz, boolean, text, boolean, int, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_certificate_email_status(uuid, text, boolean, timestamptz, boolean, uuid, boolean, timestamptz, boolean, text, boolean, int, boolean) TO service_role;

-- ---------------------------------------------------------------------------
-- 2. complete_certificate_email_lease
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.complete_certificate_email_lease(uuid, uuid, text, text);

CREATE OR REPLACE FUNCTION public.complete_certificate_email_lease(
  p_certificate_id uuid,
  p_lease_token uuid,
  p_email_status text,
  p_email_error text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Only administrators can complete certificate email leases';
  END IF;

  -- NULL-safe validation: the IS NULL test must come first because
  -- `NULL NOT IN ('sent', 'failed')` evaluates to NULL, which previously
  -- bypassed this check and let a NULL status complete the lease.
  IF p_email_status IS NULL OR p_email_status NOT IN ('sent', 'failed') THEN
    RAISE EXCEPTION 'Email status must be ''sent'' or ''failed''';
  END IF;

  -- Only the current lease owner may complete or fail the delivery: the
  -- token must still match and the status must still be 'sending'.
  UPDATE public.certificates
  SET
    email_status = p_email_status,
    email_sent_at = CASE WHEN p_email_status = 'sent' THEN pg_catalog.now() ELSE email_sent_at END,
    email_lease_token = NULL,
    email_lease_acquired_at = NULL,
    email_error = CASE WHEN p_email_status = 'failed' THEN p_email_error ELSE NULL END,
    email_retry_count = COALESCE(email_retry_count, 0) + 1
  WHERE id = p_certificate_id
    AND email_status = 'sending'
    AND email_lease_token = p_lease_token;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_certificate_email_lease(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_certificate_email_lease(uuid, uuid, text, text) TO service_role;
