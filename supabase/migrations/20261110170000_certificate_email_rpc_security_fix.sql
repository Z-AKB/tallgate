-- Certificate email RPC security fix (follow-up to 20261110150000 and 20261110160000)
--
-- Previously applied migrations are left untouched; every fix is applied on
-- top by replacing function definitions and re-asserting grants.
--
-- Review findings addressed here:
--
--   1. SECURITY DEFINER search_path: the earlier definitions used
--      SET search_path = public, which lets anyone who can create objects
--      in the public schema hijack definer-context name resolution. These
--      functions now pin an empty search_path and schema-qualify every
--      reference (public.*, pg_catalog.*), matching the repo baseline
--      (20260930000000 is_admin).
--   2. Authorization: the earlier is_admin()-only checks rejected every
--      call made by server-side code, because that code uses the
--      service-role admin client where auth.uid() is NULL. A new
--      is_service_role() helper detects PostgREST's service role from
--      request.jwt.claims, and all four functions now accept
--      is_admin() OR is_service_role().
--   3. NULL handling: update_certificate_email_status could not
--      distinguish "parameter omitted" from "explicitly clear this field"
--      (CASE WHEN param IS NOT NULL ...). Each value parameter now has a
--      p_set_* boolean flag: the column is written only when its flag is
--      true, and may then be written as NULL to clear it.
--   4. EXECUTE hygiene: functions are PUBLIC-executable by default, so
--      the earlier GRANT EXECUTE ... TO authenticated restricted nothing.
--      EXECUTE is now revoked from PUBLIC/anon/authenticated and granted
--      only to service_role; the in-function checks remain as the second
--      layer (definer functions run as their owner, which is unaffected
--      by these grants).
--   5. Stuck leases: release_stale_certificate_email_leases now treats a
--      missing email_lease_acquired_at as expired so a certificate can
--      never remain in 'sending' forever, and the retry counter no longer
--      computes NULL + 1 on rows without a retry count.
--
-- Note: REVOKE of privileges a role does not hold only raises a warning,
-- so the repeated revokes below are safe on databases where 20261110160000
-- already ran.

-- ---------------------------------------------------------------------------
-- 1. Service-role detection helper
-- ---------------------------------------------------------------------------

-- True when the caller is PostgREST's service role. PostgREST exposes the
-- verified JWT claims through the request.jwt.claims GUC (the same source
-- auth.uid() reads); an unset GUC or any other role yields false. Users
-- cannot forge this GUC: it is set by PostgREST after JWT verification.
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(pg_catalog.current_setting('request.jwt.claims', true)::jsonb ->> 'role', '') = 'service_role'
$$;

REVOKE ALL ON FUNCTION public.is_service_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_service_role() FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO service_role;

-- ---------------------------------------------------------------------------
-- 2. update_certificate_email_status
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.update_certificate_email_status(uuid, text, timestamptz, uuid, timestamptz, text, int);

-- Column/value pairs: a column is updated only when its p_set_* flag is
-- true; passing the value without the flag (or the flag with a NULL value)
-- leaves the column unchanged, while flag + NULL explicitly clears it.
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

  IF p_set_email_status AND p_email_status NOT IN ('pending', 'sending', 'sent', 'failed') THEN
    RAISE EXCEPTION 'Invalid email status: %', p_email_status;
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
-- 3. claim_certificate_email_lease
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.claim_certificate_email_lease(uuid, uuid, interval);

CREATE OR REPLACE FUNCTION public.claim_certificate_email_lease(
  p_certificate_id uuid,
  p_lease_token uuid,
  p_lease_timeout interval DEFAULT '5 minutes'
)
RETURNS TABLE (
  claimed boolean,
  current_status text,
  current_lease_token uuid,
  current_retry_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT (public.is_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Only administrators can claim certificate email leases';
  END IF;

  IF p_certificate_id IS NULL OR p_lease_token IS NULL THEN
    RAISE EXCEPTION 'Certificate id and lease token are required';
  END IF;

  -- Atomically claim the lease when the certificate is claimable. The
  -- RETURNING list reports the post-update state; RETURN QUERY sets FOUND,
  -- so a miss falls through to the read-only state report below.
  RETURN QUERY
  UPDATE public.certificates
  SET
    email_status = 'sending',
    email_lease_token = p_lease_token,
    email_lease_acquired_at = pg_catalog.now(),
    email_error = NULL
  WHERE id = p_certificate_id
    AND email_status IN ('pending', 'failed')
  RETURNING true AS claimed, email_status AS current_status, email_lease_token AS current_lease_token, email_retry_count AS current_retry_count;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false AS claimed, email_status AS current_status, email_lease_token AS current_lease_token, email_retry_count AS current_retry_count
    FROM public.certificates
    WHERE id = p_certificate_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_certificate_email_lease(uuid, uuid, interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_certificate_email_lease(uuid, uuid, interval) TO service_role;

-- ---------------------------------------------------------------------------
-- 4. complete_certificate_email_lease
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

  IF p_email_status NOT IN ('sent', 'failed') THEN
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

-- ---------------------------------------------------------------------------
-- 5. release_stale_certificate_email_leases
-- ---------------------------------------------------------------------------

DROP FUNCTION IF EXISTS public.release_stale_certificate_email_leases(interval);

CREATE OR REPLACE FUNCTION public.release_stale_certificate_email_leases(
  p_lease_timeout_interval interval DEFAULT '5 minutes'
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_released_count int;
BEGIN
  IF NOT (public.is_admin() OR public.is_service_role()) THEN
    RAISE EXCEPTION 'Only administrators can release stale email leases';
  END IF;

  UPDATE public.certificates
  SET
    email_status = 'pending',
    email_lease_token = NULL,
    email_lease_acquired_at = NULL,
    email_error = 'Email lease expired, retry available'
  WHERE email_status = 'sending'
    AND (
      email_lease_acquired_at IS NULL
      OR email_lease_acquired_at < (pg_catalog.now() - p_lease_timeout_interval)
    );

  GET DIAGNOSTICS v_released_count = ROW_COUNT;
  RETURN v_released_count;
END;
$$;

REVOKE ALL ON FUNCTION public.release_stale_certificate_email_leases(interval) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_stale_certificate_email_leases(interval) TO service_role;

-- ---------------------------------------------------------------------------
-- 6. Re-assert table grants (idempotent; see note at the top)
-- ---------------------------------------------------------------------------

-- Column-level UPDATE grants were handed to authenticated by
-- 20261110000000; all certificate email/lease mutations now go through the
-- SECURITY DEFINER functions above, so authenticated keeps read-only
-- access (RLS policies still apply to reads).
REVOKE UPDATE (email_status, email_sent_at, email_error, email_retry_count) ON public.certificates FROM authenticated;
REVOKE UPDATE (email_lease_token, email_lease_acquired_at) ON public.certificates FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.certificates FROM authenticated;
GRANT SELECT ON public.certificates TO authenticated;
