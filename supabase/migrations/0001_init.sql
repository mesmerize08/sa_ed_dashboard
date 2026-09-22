-- Phase 1 (ED MVP) schema. See the approved plan for rationale:
-- raw per-snapshot rows now, no materialized rollups until real usage
-- data shows they're needed.

create table hospitals (
  id bigint generated always as identity primary key,
  short_code text not null unique,
  full_name text not null,
  type text not null check (type in ('metro', 'country'))
);

create table ed_snapshots (
  id bigint generated always as identity primary key,
  hospital_id bigint not null references hospitals (id),
  captured_at timestamptz not null,
  expected_arrivals integer not null,
  waiting_to_be_seen integer not null,
  com_treat integer not null,
  capacity integer not null,
  -- SA Health's AVG_WAIT: non-urgent (triage 3-5) cases only, not an
  -- all-patient average. See src/lib/sahealth/mappers.ts.
  avg_wait_minutes numeric not null
);
create index ed_snapshots_hospital_time_idx on ed_snapshots (hospital_id, captured_at);

create table ed_stream_snapshots (
  id bigint generated always as identity primary key,
  hospital_id bigint not null references hospitals (id),
  captured_at timestamptz not null,
  stream text not null,
  wts_total integer not null,
  treat_total integer not null,
  wfb_total integer not null,
  time_in_ed_buckets jsonb not null
);
create index ed_stream_snapshots_hospital_time_idx on ed_stream_snapshots (hospital_id, captured_at);

create table ed_triage_snapshots (
  id bigint generated always as identity primary key,
  hospital_id bigint not null references hospitals (id),
  captured_at timestamptz not null,
  triage_category smallint not null check (triage_category between 1 and 5),
  waiting_to_be_seen integer not null,
  waiting_over_threshold integer not null,
  -- Raw source value, not yet reverse-engineered into a clean boolean.
  -- See src/lib/sahealth/mappers.ts.
  alert_raw integer not null,
  other integer not null,
  total integer not null
);
create index ed_triage_snapshots_hospital_time_idx on ed_triage_snapshots (hospital_id, captured_at, triage_category);

create table poll_log (
  id bigint generated always as identity primary key,
  polled_at timestamptz not null default now(),
  status text not null check (status in ('ingested', 'skipped_no_new_data', 'error')),
  detail text
);
