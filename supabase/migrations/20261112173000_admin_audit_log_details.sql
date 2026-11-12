-- Extend admin audit log to capture structured issuance/context details.
-- Additive, nullable, forward-only: existing rows remain valid.

ALTER TABLE public.admin_audit_log
  ADD COLUMN IF NOT EXISTS details jsonb;

COMMENT ON COLUMN public.admin_audit_log.details IS
  'Optional structured metadata for security-relevant admin actions (e.g. certificate issuance context). Must not contain secrets, tokens, passwords, or full request payloads.';
