import type { SupabaseClient } from "@supabase/supabase-js";

const BASELINE_WINDOW_DAYS = 12 * 7;

export interface HospitalRow {
  id: number;
  short_code: string;
  full_name: string;
  type: "metro" | "country";
}

/** Loads all known hospitals, keyed by short code, for mapping poll results to hospital_id. */
export async function getHospitalsByShortCode(db: SupabaseClient): Promise<Map<string, HospitalRow>> {
  const { data, error } = await db.from("hospitals").select("*");
  if (error) throw error;
  return new Map((data as HospitalRow[]).map((h) => [h.short_code, h]));
}

/**
 * Registers a hospital not seen before (country EDs whose HOSP_SHORT is
 * already a full name) rather than dropping their data on the floor.
 */
export async function ensureCountryHospital(db: SupabaseClient, shortCode: string): Promise<HospitalRow> {
  const { data, error } = await db
    .from("hospitals")
    .upsert({ short_code: shortCode, full_name: shortCode, type: "country" }, { onConflict: "short_code" })
    .select("*")
    .single();
  if (error) throw error;
  return data as HospitalRow;
}

export async function getHospitalById(db: SupabaseClient, id: number): Promise<HospitalRow | null> {
  const { data, error } = await db.from("hospitals").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as HospitalRow | null) ?? null;
}

export async function getAllHospitals(db: SupabaseClient): Promise<HospitalRow[]> {
  const { data, error } = await db.from("hospitals").select("*").order("full_name");
  if (error) throw error;
  return data as HospitalRow[];
}

export interface EdSnapshotRow {
  captured_at: string;
  expected_arrivals: number;
  waiting_to_be_seen: number;
  com_treat: number;
  capacity: number;
  avg_wait_minutes: number;
}

export async function getLatestSnapshot(db: SupabaseClient, hospitalId: number): Promise<EdSnapshotRow | null> {
  const { data, error } = await db
    .from("ed_snapshots")
    .select("captured_at, expected_arrivals, waiting_to_be_seen, com_treat, capacity, avg_wait_minutes")
    .eq("hospital_id", hospitalId)
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return (data as EdSnapshotRow | null) ?? null;
}

export async function getSnapshotsSince(
  db: SupabaseClient,
  hospitalId: number,
  since: Date,
): Promise<EdSnapshotRow[]> {
  const { data, error } = await db
    .from("ed_snapshots")
    .select("captured_at, expected_arrivals, waiting_to_be_seen, com_treat, capacity, avg_wait_minutes")
    .eq("hospital_id", hospitalId)
    .gte("captured_at", since.toISOString())
    .order("captured_at", { ascending: true });
  if (error) throw error;
  return data as EdSnapshotRow[];
}

export interface TriageSnapshotRow {
  triage_category: number;
  waiting_to_be_seen: number;
  waiting_over_threshold: number;
  total: number;
}

/** Triage rows from the same poll as the hospital's latest ed_snapshot. */
export async function getLatestTriageSnapshots(
  db: SupabaseClient,
  hospitalId: number,
  capturedAt: string,
): Promise<TriageSnapshotRow[]> {
  const { data, error } = await db
    .from("ed_triage_snapshots")
    .select("triage_category, waiting_to_be_seen, waiting_over_threshold, total")
    .eq("hospital_id", hospitalId)
    .eq("captured_at", capturedAt);
  if (error) throw error;
  return data as TriageSnapshotRow[];
}

export async function getLatestCapturedAt(db: SupabaseClient): Promise<Date | null> {
  const { data, error } = await db
    .from("ed_snapshots")
    .select("captured_at")
    .order("captured_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? new Date(data.captured_at) : null;
}

export interface EdSnapshotInsert {
  hospital_id: number;
  captured_at: string;
  expected_arrivals: number;
  waiting_to_be_seen: number;
  com_treat: number;
  capacity: number;
  avg_wait_minutes: number;
}

export async function insertEdSnapshots(db: SupabaseClient, rows: EdSnapshotInsert[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await db.from("ed_snapshots").insert(rows);
  if (error) throw error;
}

export interface EdTriageSnapshotInsert {
  hospital_id: number;
  captured_at: string;
  triage_category: number;
  waiting_to_be_seen: number;
  waiting_over_threshold: number;
  alert_raw: number;
  other: number;
  total: number;
}

export async function insertEdTriageSnapshots(db: SupabaseClient, rows: EdTriageSnapshotInsert[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await db.from("ed_triage_snapshots").insert(rows);
  if (error) throw error;
}

export async function logPoll(
  db: SupabaseClient,
  status: "ingested" | "skipped_no_new_data" | "error",
  detail?: string,
): Promise<void> {
  const { error } = await db.from("poll_log").insert({ status, detail: detail ?? null });
  if (error) throw error;
}

export interface CapacityBaseline {
  avgOccupancyPercent: number;
  sampleSize: number;
}

export async function getCapacityBaseline(
  db: SupabaseClient,
  hospitalId: number,
  at: Date,
): Promise<CapacityBaseline> {
  const { hour, dow, since } = baselineWindow(at);
  const { data, error } = await db
    .rpc("get_capacity_baseline", { p_hospital_id: hospitalId, p_hour: hour, p_dow: dow, p_since: since })
    .single();
  if (error) throw error;
  const row = data as { avg_occupancy_percent: number | null; sample_size: number };
  return { avgOccupancyPercent: Number(row.avg_occupancy_percent ?? 0), sampleSize: Number(row.sample_size) };
}

export interface WaitBaseline {
  avgWaitMinutes: number;
  sampleSize: number;
}

export async function getWaitBaseline(db: SupabaseClient, hospitalId: number, at: Date): Promise<WaitBaseline> {
  const { hour, dow, since } = baselineWindow(at);
  const { data, error } = await db
    .rpc("get_wait_baseline", { p_hospital_id: hospitalId, p_hour: hour, p_dow: dow, p_since: since })
    .single();
  if (error) throw error;
  const row = data as { avg_wait_minutes: number | null; sample_size: number };
  return { avgWaitMinutes: Number(row.avg_wait_minutes ?? 0), sampleSize: Number(row.sample_size) };
}

export interface TriageWotBaseline {
  avgWot: number;
  sampleSize: number;
}

export async function getTriageWotBaseline(
  db: SupabaseClient,
  hospitalId: number,
  category: number,
  at: Date,
): Promise<TriageWotBaseline> {
  const { hour, dow, since } = baselineWindow(at);
  const { data, error } = await db
    .rpc("get_triage_wot_baseline", {
      p_hospital_id: hospitalId,
      p_category: category,
      p_hour: hour,
      p_dow: dow,
      p_since: since,
    })
    .single();
  if (error) throw error;
  const row = data as { avg_wot: number | null; sample_size: number };
  return { avgWot: Number(row.avg_wot ?? 0), sampleSize: Number(row.sample_size) };
}

function baselineWindow(at: Date): { hour: number; dow: number; since: string } {
  const adelaideParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Australia/Adelaide",
    hourCycle: "h23",
    hour: "2-digit",
    weekday: "short",
  }).formatToParts(at);
  const hour = Number(adelaideParts.find((p) => p.type === "hour")?.value ?? "0");
  const weekdayShort = adelaideParts.find((p) => p.type === "weekday")?.value ?? "Sun";
  const dow = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayShort);
  const since = new Date(at.getTime() - BASELINE_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  return { hour, dow, since };
}
