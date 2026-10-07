do $$
begin
  if exists (
    select 1
    from public.user_roles
    group by user_id
    having count(*) > 1
  ) then
    raise exception
      'Cannot enforce one role per user while duplicate assignments exist. Resolve duplicate rows in public.user_roles first.';
  end if;
end;
$$;

alter table public.user_roles
  drop constraint if exists user_roles_user_id_role_id_key;

alter table public.user_roles
  add constraint user_roles_user_id_key unique (user_id);
