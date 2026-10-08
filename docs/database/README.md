# Database setup

The application schema lives in `supabase/migrations/` and the generated
types are in `types/supabase.ts`. The timestamped Phase 3 migrations are
authoritative. Apply them in filename order; the full ordered list is also in
the root `README.md`.

Core tables include:

- `roles` and `user_roles` for the single-role checks used by the admin guard
  (`user_roles` has exactly one row per user via `unique(user_id)`)
- `courses`, `course_modules`, `lessons`, and `lesson_content` for the learning
  catalogue
- `course_categories` for the admin-managed list of Learning Hub domains
- `course_enrollments` and `lesson_progress` for learner progress
- `certificates` for verifiable graduation credentials
- `live_sessions` for scheduled classes
- `payment_requests` for payment tracking
- `contact_messages`, `consultation_requests`, `service_inquiries`, and
  `startup_applications` for public intake

Row-level security is enabled on every table. Public visitors can submit
inquiries and verify certificates; intake writes go through the validated,
rate-limited API routes. Users can read their own enrollments, progress, and
startup applications. Only admins can access the inquiry queue, review
applications, author course content, or manage roles.

## Apply the migrations

Apply migrations through the Supabase CLI so each one is recorded in the
project's migration history:

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

The migrations intentionally do not grant admin privileges to a user
automatically. After the user has registered and verified their account, run
the following in the Supabase SQL Editor, replacing the email with the
intended admin's verified account:

```sql
begin;

insert into public.user_roles (user_id, role_id)
select u.id, r.id
from auth.users u
cross join public.roles r
where u.email = 'admin@example.com'
  and r.name = 'admin'
on conflict (user_id) do update set role_id = excluded.role_id;

commit;
```

If migrations were applied manually in the SQL Editor, reconcile Supabase's
migration history before running `supabase db push`; do not blindly rerun
these SQL files. Prefer applying the full ordered list through the CLI so the
schema and migration history stay consistent.