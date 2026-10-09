-- Honour the account type chosen on the registration form.
--
-- The sign-up form sends raw_user_meta_data.account_type, but
-- handle_new_user() always assigned the 'learner' role, so selecting
-- "Startup Founder" or "Business Owner" silently did nothing.
--
-- Only a fixed allow-list of self-service roles is honoured. raw_user_meta_data
-- is attacker-controlled, so privileged roles (admin, instructor) can never be
-- self-assigned here. Enforced one-role-per-user (see
-- 20261007100000_enforce_single_role_per_user.sql), so exactly one role is set.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_role text := new.raw_user_meta_data->>'account_type';
  assigned_role text;
  assigned_role_id uuid;
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );

  assigned_role := case
    when requested_role in ('startup_founder', 'business_owner') then requested_role
    else 'learner'
  end;

  select roles.id into assigned_role_id
  from public.roles
  where roles.name = assigned_role
  limit 1;

  -- Fall back to learner if the requested role row is missing.
  if assigned_role_id is null then
    select roles.id into assigned_role_id
    from public.roles
    where roles.name = 'learner'
    limit 1;
  end if;

  if assigned_role_id is not null then
    insert into public.user_roles (user_id, role_id)
    values (new.id, assigned_role_id)
    on conflict (user_id) do nothing;
  end if;

  return new;
end;
$$;
