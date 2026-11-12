-- Manual issuance duplicate prevention and email lease ownership (FIXED)
-- Adds partial unique index for (user_id, course_title, issue_date) where course_id IS NULL
-- Adds lease token and separate lease acquisition timestamp for email delivery ownership
-- Safe to apply on existing data
-- FIX: Preflight check now raises EXCEPTION if duplicates exist, stopping migration

-- 1. Report any existing duplicate (user_id, course_title, issue_date) combinations for manual issuance
-- This will FAIL the migration if duplicates are found, with actionable diagnostic info
DO $$
DECLARE
    dup_count integer;
    dup record;
BEGIN
    SELECT count(*)
    INTO dup_count
    FROM (
        SELECT user_id, course_title, issue_date, count(*) as cnt
        FROM public.certificates
        WHERE course_id IS NULL
        GROUP BY user_id, course_title, issue_date
        HAVING count(*) > 1
    ) dups;
    
    IF dup_count > 0 THEN
        -- Log the duplicates for manual review
        RAISE NOTICE 'Found % duplicate (user_id, course_title, issue_date) combinations for manual issuance. Migration will fail.', dup_count;
        RAISE NOTICE 'Duplicates:';
        FOR dup IN (
            SELECT user_id, course_title, issue_date, count(*) as cnt, array_agg(id) as cert_ids
            FROM public.certificates
            WHERE course_id IS NULL
            GROUP BY user_id, course_title, issue_date
            HAVING count(*) > 1
        ) LOOP
            RAISE NOTICE '  user_id: %, course_title: %, issue_date: %, count: %, cert_ids: %', dup.user_id, dup.course_title, dup.issue_date, dup.cnt, dup.cert_ids;
        END LOOP;
        -- EXPLICITLY FAIL THE MIGRATION - duplicates must be resolved manually first
        RAISE EXCEPTION 'Cannot create unique index: % duplicate (user_id, course_title, issue_date) combinations found for manual issuance. Resolve duplicates manually before applying this migration.', dup_count;
    ELSE
        RAISE NOTICE 'No duplicate (user_id, course_title, issue_date) combinations found for manual issuance. Safe to add constraint.';
    END IF;
END $$;

-- 2. Add partial unique index for manual issuance duplicate prevention
-- Only applies when course_id IS NULL (course-based issuance covered by certificates_user_course_unique)
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_title_date_unique
ON public.certificates (user_id, course_title, issue_date)
WHERE course_id IS NULL;

-- 3. Add email lease token column for ownership tracking
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS email_lease_token uuid;

-- 4. Add separate lease acquisition timestamp (distinct from email_sent_at which is for successful delivery)
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS email_lease_acquired_at timestamptz;

-- 5. Add index for finding certificates with 'sending' status older than lease timeout (for cleanup)
-- Uses the new lease acquisition timestamp
-- Distinct name from idx_certificates_email_sending_stale (email_sent_at) created by
-- 20261110120000, so both indexes are created independently.
CREATE INDEX IF NOT EXISTS idx_certificates_email_lease_stale
ON public.certificates (email_lease_acquired_at)
WHERE email_status = 'sending';

-- 6. NO GRANTS to authenticated for email/lease columns
-- Mutations are done via service role (admin client) which bypasses RLS
-- SECURITY DEFINER functions in 20261110160000_certificate_permissions_fix.sql handle authorized operations