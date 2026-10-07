-- B1: explicitly labelled DEMO certificate rows.
--
-- These exist so /verify can be exercised end to end without minting real
-- credentials. Every recipient_name is prefixed with "[DEMO]" so seeded rows are
-- never mistaken for issued certificates.
--
-- Two rows are valid and one is revoked so all three public verification states
-- (VALID / REVOKED / NOT FOUND) are reachable without touching real data.
--
-- Fixed verification_code values make this migration safe to re-run.
-- certificate_number is left to the sequence default from
-- 20260930000000_certificate_registry.sql.

insert into public.certificates (
  verification_code,
  recipient_name,
  course_title,
  issue_date,
  grade,
  is_valid
)
values
  (
    'TG-DEMO-VALID01',
    '[DEMO] Amina Yusuf',
    'Applied AI & Large Language Models in Production',
    current_date - 24,
    'Distinction',
    true
  ),
  (
    'TG-DEMO-VALID02',
    '[DEMO] Zainab Mohammed',
    'Fintech Systems & Payment Infrastructure Design',
    current_date - 22,
    'Merit',
    true
  ),
  (
    'TG-DEMO-REVOKED1',
    '[DEMO] Victor Ogundipe',
    'Full-Stack Enterprise Cloud Engineering',
    current_date - 35,
    'Distinction',
    false
  )
on conflict (verification_code) do nothing;