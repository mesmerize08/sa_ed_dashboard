-- The 7 metro EDs SA Health itself lists under "ED hours" on the dashboard's
-- About page. Country hospitals are auto-registered by the poller on first
-- sighting (see src/lib/poller/ingest.ts) since their HOSP_SHORT value is
-- already a full name, unlike the metro short codes below.
insert into hospitals (short_code, full_name, type) values
  ('FMC', 'Flinders Medical Centre', 'metro'),
  ('LMH', 'Lyell McEwin Hospital', 'metro'),
  ('MH', 'Modbury Hospital', 'metro'),
  ('NHS', 'Noarlunga Hospital', 'metro'),
  ('RAH', 'Royal Adelaide Hospital', 'metro'),
  ('TQEH', 'The Queen Elizabeth Hospital', 'metro'),
  ('WCH', 'Women''s and Children''s Hospital', 'metro')
on conflict (short_code) do nothing;
