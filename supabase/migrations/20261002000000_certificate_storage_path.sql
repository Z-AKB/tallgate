-- Add storage path for certificate PDFs
alter table public.certificates
  add column if not exists storage_path text;

-- Ensure private certificates bucket exists
insert into storage.buckets (id, name, public)
  values ('certificates', 'certificates', false)
  on conflict (id) do update set public = false;
