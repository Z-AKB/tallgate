do $$
begin
  if exists (
    select 1
    from public.contact_inquiries
    where char_length(trim(name)) not between 1 and 120
      or char_length(email) > 254
      or email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
      or (phone is not null and char_length(trim(phone)) > 40)
      or char_length(trim(message)) not between 1 and 10000
  ) then
    raise exception
      'Existing contact inquiries violate the new input limits. Correct those rows before applying this migration.';
  end if;

  if exists (
    select 1
    from public.startup_applications
    where char_length(trim(business_name)) not between 1 and 160
      or char_length(trim(pitch_summary)) not between 1 and 10000
  ) then
    raise exception
      'Existing startup applications violate the new input limits. Correct those rows before applying this migration.';
  end if;
end;
$$;

alter table public.contact_inquiries
  add constraint contact_inquiries_name_length_check
    check (char_length(trim(name)) between 1 and 120),
  add constraint contact_inquiries_email_format_check
    check (
      char_length(email) <= 254
      and email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'
    ),
  add constraint contact_inquiries_phone_length_check
    check (phone is null or char_length(trim(phone)) <= 40),
  add constraint contact_inquiries_message_length_check
    check (char_length(trim(message)) between 1 and 10000);

alter table public.startup_applications
  add constraint startup_applications_business_name_length_check
    check (char_length(trim(business_name)) between 1 and 160),
  add constraint startup_applications_pitch_summary_length_check
    check (char_length(trim(pitch_summary)) between 1 and 10000);
