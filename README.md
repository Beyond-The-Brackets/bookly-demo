> [!WARNING]
> **⚠️ Intentionally vulnerable demo app — do not deploy.**
>
> Bookly is the demo app of [Grace](https://agent-grace.com). It was written to look like a typical
> AI-generated app, and it ships with **deliberately planted problems** (security, tests,
> performance, duplication) so that Grace's onboarding demo has something real to find and fix.
> Do not run it on the internet, do not reuse its code, and do not put real data in it.
> The Supabase key embedded in the code is **fake** and works against no project.
> See [SECURITY.md](SECURITY.md).

# Bookly

Online booking for independents — coaches, physios, yoga teachers. Practitioners get a public booking
page, a list of upcoming appointments, their services, weekly availability and a client list.

> This is a demo app for [Grace](https://agent-grace.com). All data is fictitious.

## Stack

- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui components
- Supabase (Postgres, Auth, row level security) via `@supabase/ssr`
- Vitest for unit tests

## Features

| Route | What it does |
|---|---|
| `/` | Landing page |
| `/login`, `/signup` | Email + password auth |
| `/dashboard` | Upcoming bookings, cancel with the late-cancellation fee |
| `/dashboard/services` | Services (name, duration, price) |
| `/dashboard/availability` | Weekly opening hours |
| `/dashboard/clients` | Clients and how many times they booked |
| `/book/[slug]` | Public booking page, no account needed |
| `POST /api/bookings` | Create a booking from the public page |
| `GET /api/bookings/[id]` | Booking detail for the signed-in practitioner |
| `POST /api/bookings/[id]/cancel` | Cancel a booking and compute the fee |

## Running locally

Requirements: Node 20+, pnpm, and Docker (for the local Supabase stack).

```bash
pnpm install

# 1. Start Supabase locally. The first run pulls the Docker images,
#    then applies supabase/migrations and supabase/seed.sql.
npx supabase start

# 2. (later) Wipe the local database and re-apply migration + seed
npx supabase db reset

# 3. Configure the app
cp .env.example .env.local
# paste the ANON_KEY printed by `npx supabase start` (or `npx supabase status -o env`)
# into NEXT_PUBLIC_SUPABASE_ANON_KEY

# 4. Run it
pnpm dev
```

Open http://localhost:3000. The seed creates two practitioners:

| Booking page | Login | Password |
|---|---|---|
| `/book/demo-coach` | `alex@example.com` | `bookly-demo-password` |
| `/book/river-yoga` | `sam@example.com` | `bookly-demo-password` |

You can also create your own account at `/signup` (email confirmation is off locally).
Supabase Studio runs at http://127.0.0.1:54323.

## Scripts

```bash
pnpm dev        # dev server
pnpm test       # unit tests (no database needed)
pnpm lint
pnpm typecheck
pnpm build
```

## Project layout

```
app/                     routes (pages, server actions, API routes)
components/              app components
components/ui/           shadcn/ui primitives
lib/                     Supabase clients, dates, slots, billing, validation
supabase/migrations/     database schema and policies
supabase/seed.sql        demo data
```

## Cancellation policy

Free up to 24 hours before the appointment, 50% between 24 and 2 hours before, full price after
that. See `lib/billing.ts`.
