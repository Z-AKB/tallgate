# Database setup

The initial application schema is in
[`supabase/migrations/20260929000000_initial_app_schema.sql`](../../supabase/migrations/20260929000000_initial_app_schema.sql).
Apply [`supabase/migrations/20261005142000_enforce_single_user_role.sql`](../../supabase/migrations/20261005142000_enforce_single_user_role.sql)
after the initial schema. It enforces one role per user and stops if
existing users have multiple roles; resolve those assignments explicitly
before retrying it. Then apply
[`supabase/migrations/20261005143000_bound_public_submission_fields.sql`](../../supabase/migrations/20261005143000_bound_public_submission_fields.sql)
to enforce the same email and field-size limits at the database boundary,
including for direct Supabase REST inserts. It also stops if existing inquiry
or application rows need cleanup.
It creates the tables currently queried by the app:

- `user_roles` for the role checks used by the admin guard
- `contact_inquiries` for the public contact form and admin inquiry list
- `startup_applications` for signed-in founder submissions
- `certificates` for public certificate number/date verification

Allowed role values are constrained directly on `user_roles.role`; this
schema does not have a separate `roles` table.
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
supabase init
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

Run these commands from the repository root. Keep the migration files in
place; do not paste them into the SQL Editor and then run `db push`, as the
database schema and CLI migration history would become inconsistent.

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
begin;

delete from public.user_roles
where user_id = (
  select id from auth.users where email = 'admin@example.com'
);

insert into public.user_roles (user_id, role)
select id, 'admin'
from auth.users
where email = 'admin@example.com';

commit;
```

The project does not yet include learning catalogue, enrollment, lesson
progress, or certificate issuance tables/workflows. Add those in a later,
separate migration when their app data model and policies are defined.

If migrations were applied manually in the SQL Editor, reconcile Supabase's
migration history before running `supabase db push`; do not blindly rerun
these SQL files. The initial schema migration is not safe to rerun because it
creates tables, policies, and functions without idempotent guards. The
single-role and submission-limits migrations are one-time migrations and are
not safe to rerun.
