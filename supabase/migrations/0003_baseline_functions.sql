-- Baseline queries for the "busier/quieter than usual" and triage-severity
-- features. Implemented as SQL functions (rather than PostgREST filters)
-- since they need EXTRACT(hour/dow ... at time zone 'Australia/Adelaide'),
-- which the REST query builder can't express. Callers pass p_since as a
-- rolling window bound (e.g. now() - interval '12 weeks') per the
-- engineering standard against unbounded full-table scans as history grows.

create or replace function get_capacity_baseline(
  p_hospital_id bigint,
  p_hour smallint,
  p_dow smallint,
  p_since timestamptz
) returns table(avg_occupancy_percent numeric, sample_size bigint)
language sql stable as $$
  select
    avg(
      case when capacity = 0 then 0
      else (waiting_to_be_seen + com_treat)::numeric / capacity * 100
      end
    ) as avg_occupancy_percent,
    count(*) as sample_size
  from ed_snapshots
  where hospital_id = p_hospital_id
    and captured_at >= p_since
    and extract(hour from captured_at at time zone 'Australia/Adelaide') = p_hour
    and extract(dow from captured_at at time zone 'Australia/Adelaide') = p_dow;
$$;

create or replace function get_wait_baseline(
  p_hospital_id bigint,
  p_hour smallint,
  p_dow smallint,
  p_since timestamptz
) returns table(avg_wait_minutes numeric, sample_size bigint)
language sql stable as $$
  select avg(avg_wait_minutes) as avg_wait_minutes, count(*) as sample_size
  from ed_snapshots
  where hospital_id = p_hospital_id
    and captured_at >= p_since
    and extract(hour from captured_at at time zone 'Australia/Adelaide') = p_hour
    and extract(dow from captured_at at time zone 'Australia/Adelaide') = p_dow;
$$;

create or replace function get_triage_wot_baseline(
  p_hospital_id bigint,
  p_category smallint,
  p_hour smallint,
  p_dow smallint,
  p_since timestamptz
) returns table(avg_wot numeric, sample_size bigint)
language sql stable as $$
  select avg(waiting_over_threshold) as avg_wot, count(*) as sample_size
  from ed_triage_snapshots
  where hospital_id = p_hospital_id
    and triage_category = p_category
    and captured_at >= p_since
    and extract(hour from captured_at at time zone 'Australia/Adelaide') = p_hour
    and extract(dow from captured_at at time zone 'Australia/Adelaide') = p_dow;
$$;
