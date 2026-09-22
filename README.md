# SA ED Dashboard

A clearer, plain-language, mobile-first alternative to SA Health's Emergency
Department dashboard. See `docs/plan.md`-equivalent context: this is phase 1
(ED only) of the approved plan — pulls the same public JSON data SA Health
itself publishes, stores history, and shows "busier/quieter than usual"
context instead of just a raw snapshot.

## Stack

Next.js (App Router, TypeScript) + Supabase (Postgres), built as an
installable PWA. The poller is triggered on a schedule by a GitHub Actions
workflow rather than Vercel Cron — Vercel's free Hobby plan only allows
daily cron jobs, too infrequent for meaningful trend data, so
`.github/workflows/poll.yml` pings the same `/api/cron/poll` endpoint every
30 minutes for free instead. See `src/lib/domain/` for the core business
logic (capacity status, wait-time labelling, busier/quieter baseline,
triage severity) — all unit tested — and `src/lib/poller/ingest.ts` for the
polling pipeline itself.

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
2. Add these env vars in the Vercel project settings (Production + Preview
   is enough; Development only matters if you use `vercel dev`/`vercel env
   pull`, which this project doesn't rely on):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET` — any random string you make up
3. Deploy. Skip the optional Supabase marketplace integration Vercel offers
   during setup — it injects its own differently-named env vars, which
   would just be redundant with the ones above.

## One-time setup: scheduling the poll (GitHub Actions)

1. In the GitHub repo → Settings → Secrets and variables → Actions:
   - Add secret `CRON_SECRET` — the same value you put in Vercel.
   - Add variable `VERCEL_APP_URL` — your deployment's base URL, e.g.
     `https://sa-ed-dashboard.vercel.app` (no trailing slash).
2. `.github/workflows/poll.yml` runs every 30 minutes automatically once
   pushed to the repo's default branch. You can also trigger it manually
   from the Actions tab (`workflow_dispatch`) to test it immediately rather
   than waiting for the schedule.

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
