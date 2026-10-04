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

Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable/anon key. Set `NEXT_PUBLIC_SITE_URL` to the public site origin; certificate QR links use this value. Do not use a service-role key in the browser or commit `.env.local`.

Before using the database-backed forms, learning content, or certificate registry, apply the migrations in `supabase/migrations` to the intended Supabase project in this order:

1. `20260828000000_phase3_schema.sql`
2. `20260829000000_lesson_content_gating.sql`
3. `20260930000000_certificate_registry.sql`
4. `20261001000000_lesson_progress.sql`
5. `20261002000000_certificate_storage_path.sql`
6. `20261003000000_storage_buckets_and_grants.sql`
7. `20261005000000_certificate_storage_policies.sql`
8. `20261004000000_demo_certificate_seed.sql` (optional; seeds three `[DEMO]` certificates for testing `/verify`)

Certificate PDFs are rendered server-side with `@react-pdf/renderer` and stored in the private `certificates` Storage bucket. `SUPABASE_SERVICE_ROLE_KEY` is required for issuance (upload) and for `GET /api/admin/certificates/[id]/download`, which issues a 5-minute signed URL to signed-in admins only.

When applying through the Supabase SQL Editor, run each file once, in order. The timestamped Phase 3 migrations are authoritative; do not apply the removed legacy `0001` / `0002` learning-hub migrations. The admin dashboard also requires the signed-in admin account to have the `admin` role in `user_roles`.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
