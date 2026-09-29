# Database setup

The initial application schema is in
[`supabase/migrations/20260929000000_initial_app_schema.sql`](../../supabase/migrations/20260929000000_initial_app_schema.sql).
It creates the tables currently queried by the app:

- `user_roles` for the role checks used by the admin guard
- `contact_inquiries` for the public contact form and admin inquiry list
- `startup_applications` for signed-in founder submissions
- `certificates` for public certificate number/date verification

Row-level security is enabled on every table. Public visitors can submit
inquiries and verify certificates. Certificate table access is limited to
the public fields selected by the current route: `id`,
`certificate_number`, and `issued_at`. Users can submit and read their own
startup applications. Only admins can access the inquiry queue, review
applications, or manage roles.

## Apply the migration

Apply migrations through the Supabase CLI so the migration is recorded in
the project's migration history:

```text
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

Confirm the linked project is the intended project before running `db push`.
Do not put a database password, access token, or service-role key in source
control or send it in chat. For local development, configure the public
Supabase URL and anon key in `.env.local` as described by `.env.example`.

## Bootstrap the first admin

The migration intentionally does not grant admin privileges to a user
automatically. After the user has registered and verified their account,
run the following in the Supabase SQL Editor, replacing the email with the
intended admin's verified account:

```sql
insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.com'
on conflict (user_id, role) do nothing;
```

The project does not yet include learning catalogue, enrollment, lesson
progress, or certificate issuance tables/workflows. Add those in a later,
separate migration when their app data model and policies are defined.
