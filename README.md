# TallGate

TallGate is a technology platform for Nigerian and West African tech
careers and businesses — one place to learn a skill, build a startup, and
get technical help.

## Stack

- **Frontend:** Next.js (App Router) + TypeScript
- **Styling:** Bootstrap 5 (CSS/grid/utilities only — no `bootstrap.bundle.js`;
  interactive components like modals and dropdowns are custom React
  components using React state, not Bootstrap's vanilla JS, to avoid the two
  fighting over the same DOM)
- **Backend/DB:** Supabase (Postgres + Row-Level Security + Auth + Storage +
  Edge Functions)
- **Forms:** React Hook Form + Zod

## Design tokens

Brand colors live as CSS custom properties in `app/globals.css` and are also
exported from `config/site.ts` for use in TypeScript/JS (e.g. chart colors,
inline styles). They're additionally mapped onto Bootstrap's own `--bs-*`
variables so standard Bootstrap components (`.btn-primary`, `.alert-success`,
etc.) pick up the TallGate palette automatically.

| Token | Value | Usage |
|---|---|---|
| `--color-navy` | `#031544` | Header, footer, brand framing |
| `--color-primary` | `#202db8` | Buttons, links, primary actions |
| `--color-background` | `#f6f8ff` | Page background |
| `--color-success` / `-warning` / `-danger` | — | Status fields (applications, requests, inquiries) |

## Folder structure

Feature-based structure — see `TallGate — Full System Structure.md` in the
project files for the full rationale. Key directories:

- `app/` — routes (App Router), grouped by marketing/auth/dashboard/admin etc.
- `components/` — shared, mostly presentational UI
- `features/` — domain logic grouped by feature (auth, learning, startups, ...)
- `lib/` — infrastructure (database clients, auth helpers, storage, search)
- `types/` — shared TypeScript types, including `UserRole`

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase project URL + anon key
npm run dev
```

## Status

Foundation milestone — scaffold only. No database schema, auth flows, or
pages beyond the placeholder homepage exist yet. Next: database schema +
RLS policies, then Foundation milestone build-out per the development
roadmap (Learning Hub before Startup Hub).
