# SA ED Dashboard

A clearer, plain-language, mobile-first alternative to SA Health's Emergency
Department dashboard. See `docs/plan.md`-equivalent context: this is phase 1
(ED only) of the approved plan — pulls the same public JSON data SA Health
itself publishes, stores history, and shows "busier/quieter than usual"
context instead of just a raw snapshot.

## Stack

Next.js (App Router, TypeScript) + Supabase (Postgres) + Vercel Cron, built
as an installable PWA. See `src/lib/domain/` for the core business logic
(capacity status, wait-time labelling, busier/quieter baseline, triage
severity) — all unit tested — and `src/lib/poller/ingest.ts` for the polling
pipeline.

## Local development

```bash
npm install
npm run dev       # http://localhost:3000
npm test          # vitest — the domain logic and poller pipeline
npm run lint
npm run build
```

The app runs and the UI renders without a database configured — API routes
that need Supabase will fail gracefully (a friendly "couldn't load" message
in the UI) until you set up a database, per below.

## One-time setup: Supabase

You'll need your own free Supabase project — this can't be provisioned for
you without your account.

1. Create a project at [supabase.com](https://supabase.com).
2. Run the SQL in `supabase/migrations/`, in order (`0001_init.sql`,
   `0002_seed_metro_hospitals.sql`, `0003_baseline_functions.sql`) via the
   Supabase SQL editor, or the Supabase CLI if you have it installed.
3. Copy `.env.example` to `.env.local` and fill in:
   - `SUPABASE_URL` — Project Settings → API → Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` — Project Settings → API → `service_role`
     secret (server-only; this app has no end-user auth, so all writes come
     from the cron poller with this key)

## One-time setup: deploying to Vercel

1. Import the repo into Vercel.
2. Add the same `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` env vars in the
   Vercel project settings, plus a random `CRON_SECRET` value.
3. `vercel.json` already schedules `/api/cron/poll` every 30 minutes —
   Vercel Cron sends that same `CRON_SECRET` automatically as a bearer
   token, which the route checks.
4. First deploy will start polling on its own schedule. You can also trigger
   a poll manually by visiting `/api/cron/poll` (with the `Authorization:
   Bearer <CRON_SECRET>` header if you set one).

## What's implemented (phase 1 / ED MVP)

- Poller: fetches SA Health's `ED_Etl_Cntrl`/`ED001`/`ED006` JSON endpoints,
  dedups on `CURR_DTM`, stores snapshots, auto-registers country hospitals
  on first sighting.
- API: `/api/hospitals`, `/api/hospitals/[id]/summary`,
  `/api/hospitals/[id]/trend`.
- UI: home view (pinned hospitals, saved to this device only), hospital
  picker, hospital detail view with capacity/wait trend charts.
- PWA: installable manifest + minimal offline-shell service worker.

Not yet implemented (see the plan's "explicitly out of scope" list):
Inpatient dashboard, native app wrapping, accounts, push notifications.
Also not yet ingested: `ED003`/`ED004`/`ED005` (streams/wait-buckets/KPIs) —
confirmed reachable during investigation but no UI feature uses them yet.

## Known follow-ups

- PWA icon is a single SVG (`public/icon.svg`); add real 192/512 PNG icons
  for best Android/iOS home-screen install fidelity.
- The `ED006` `ALERT` field's exact encoding (raw JSON shows values like
  -1/0/1/16, not a clean boolean) is stored verbatim in `alert_raw` rather
  than interpreted — see the comment in `src/lib/sahealth/mappers.ts`.
