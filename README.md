This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Backend Setup

The app requires Node.js 20.9.0 or newer.

Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable/anon key. Set `NEXT_PUBLIC_SITE_URL` to the public site origin; certificate QR links use this value. `SUPABASE_SERVICE_ROLE_KEY` is required server-side for admin operations and durable API rate limiting. Never expose it to browser code or commit `.env.local`.

Before using the database-backed forms, learning content, or certificate registry, apply the migrations in `supabase/migrations` to the intended Supabase project in this order:

1. `20260828000000_phase3_schema.sql`
2. `20260829000000_lesson_content_gating.sql`
3. `20260930000000_certificate_registry.sql`
4. `20261001000000_lesson_progress.sql`
5. `20261002000000_certificate_storage_path.sql`
6. `20261003000000_storage_buckets_and_grants.sql`
7. `20261004000000_demo_certificate_seed.sql` (optional; seeds three `[DEMO]` certificates for testing `/verify`)
8. `20261005000000_certificate_storage_policies.sql`
9. `20261006000000_public_api_hardening.sql`
10. `20261006010000_certificate_verification_rpc.sql`
11. `20261007000000_rate_limit_and_enrollment_hardening.sql`
12. `20261007100000_enforce_single_role_per_user.sql`
13. `20261007110000_course_documents_and_live_sessions.sql`
14. `20261007120000_admin_course_lesson_writes.sql`
15. `20261007130000_payment_requests.sql`
16. `20261007140000_course_categories.sql`
17. `20261007150000_learner_certificate_read.sql`
18. `20261007160000_harden_course_content_storage_policies.sql`
19. `20261007170000_policy_and_grant_hygiene.sql`
20. `20261007180000_seed_learning_hub_catalogue.sql` (seeds the six Learning Hub packages, one module each, and their syllabus lessons so the admin content tools have targets)
21. `20261007190000_admin_catalogue_writes.sql` (grants admins INSERT on `courses` and `course_modules` so the "Add Course" and "Seed/Sync Learning Hub Courses" actions can persist)
22. `20261007200000_signup_role_mapping.sql` (makes `handle_new_user()` honour the `account_type` chosen at sign-up, allow-listed to `startup_founder`/`business_owner`/`learner` only)

Certificate PDFs are rendered server-side with `@react-pdf/renderer` and stored in the private `certificates` Storage bucket. `SUPABASE_SERVICE_ROLE_KEY` is required for issuance (upload) and for `GET /api/admin/certificates/[id]/download`, which issues a 5-minute signed URL to signed-in admins only.

Public form endpoints also use a server-side Supabase rate-limit table. The limits are 5 contact requests, 3 consultation requests, 3 startup applications, or 5 enrollment inquiries per IP address per 15 minutes. Certificate verification is limited to 30 lookups per IP address per 15 minutes. The email endpoint requires an admin session and is limited to 20 sends per admin per hour. Production hosting must supply a trusted `x-real-ip` or `cf-connecting-ip` request header for IP-based limits to work.

The latest hardening migration revokes direct client inserts into public intake tables and active course enrollments. Intake is accepted only through the validated, rate-limited application routes; course access must be granted by a trusted administrative process.

For a new database, use the Supabase CLI to link the project, inspect migration status, and apply pending migrations with `supabase db push`. If using the SQL Editor instead, run each migration once in the order above and do not also push the same migrations through the CLI. If earlier migrations were applied manually, reconcile the CLI migration history before using `db push`; do not blindly rerun SQL against a database that already has those changes. The timestamped Phase 3 migrations are authoritative; do not apply the removed legacy `0001` / `0002` learning-hub migrations. The admin dashboard also requires the signed-in admin account to have the `admin` role in `user_roles`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
