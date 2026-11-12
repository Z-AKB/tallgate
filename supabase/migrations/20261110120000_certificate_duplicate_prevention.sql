-- Certificate duplicate prevention and email delivery safety (FIXED)
-- Adds partial unique index for (user_id, course_id) where course_id IS NOT NULL
-- Extends email_status constraint to include 'sending' state for atomic claiming
-- Safe to apply on existing data
-- FIX: Preflight check now raises EXCEPTION if duplicates exist, stopping migration

-- 1. Check for existing duplicate (user_id, course_id) combinations before adding constraint
-- This will FAIL the migration if duplicates are found, with actionable diagnostic info
DO $$
DECLARE
    dup_count integer;
    dup record;
BEGIN
    SELECT count(*)
    INTO dup_count
    FROM (
        SELECT user_id, course_id, count(*) as cnt
        FROM public.certificates
        WHERE course_id IS NOT NULL
        GROUP BY user_id, course_id
        HAVING count(*) > 1
    ) dups;
    
    IF dup_count > 0 THEN
        -- Log the duplicates for manual review
        RAISE NOTICE 'Found % duplicate (user_id, course_id) combinations. Migration will fail.', dup_count;
        RAISE NOTICE 'Duplicates:';
        FOR dup IN (
            SELECT user_id, course_id, count(*) as cnt, array_agg(id) as cert_ids
            FROM public.certificates
            WHERE course_id IS NOT NULL
            GROUP BY user_id, course_id
            HAVING count(*) > 1
        ) LOOP
            RAISE NOTICE '  user_id: %, course_id: %, count: %, cert_ids: %', dup.user_id, dup.course_id, dup.cnt, dup.cert_ids;
        END LOOP;
        -- EXPLICITLY FAIL THE MIGRATION - duplicates must be resolved manually first
        RAISE EXCEPTION 'Cannot create unique index: % duplicate (user_id, course_id) combinations found. Resolve duplicates manually before applying this migration.', dup_count;
    ELSE
        RAISE NOTICE 'No duplicate (user_id, course_id) combinations found. Safe to add constraint.';
    END IF;
END $$;

-- 2. Add partial unique index for duplicate prevention
-- Only applies when course_id IS NOT NULL (manual issuance with NULL course_id is handled separately)
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_course_unique
ON public.certificates (user_id, course_id)
WHERE course_id IS NOT NULL;

-- 3. Extend email_status constraint to include 'sending' for atomic claiming
-- First drop existing constraint, then add updated one
ALTER TABLE public.certificates
DROP CONSTRAINT IF EXISTS certificates_email_status_check;

ALTER TABLE public.certificates
ADD CONSTRAINT certificates_email_status_check
CHECK (email_status IN ('pending', 'sending', 'sent', 'failed'));

-- 4. Add index for finding certificates with 'sending' status older than lease timeout (for cleanup)
-- Note: Uses email_sent_at for backward compatibility; new code uses email_lease_acquired_at
CREATE INDEX IF NOT EXISTS idx_certificates_email_sending_stale
ON public.certificates (email_sent_at)
WHERE email_status = 'sending';

-- 5. NO GRANTS to authenticated for email/lease columns
-- Mutations are done via service role (admin client) which bypasses RLS
-- SECURITY DEFINER functions in 20261110160000_certificate_permissions_fix.sql handle authorized operations