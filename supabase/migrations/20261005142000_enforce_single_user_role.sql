do $$
begin
  if exists (
    select 1
    from public.user_roles
    group by user_id
    having count(*) > 1
  ) then
    raise exception
      'Multiple roles exist for at least one user. Resolve those assignments before applying the single-role migration.';
  end if;
end;
$$;

alter table public.user_roles
  drop constraint user_roles_pkey;

alter table public.user_roles
  add constraint user_roles_pkey primary key (user_id);
