import { mapEd001, mapEd006, mapEtlCntrl } from "../sahealth/mappers";
import { shouldIngest } from "./shouldIngest";

export interface SaHealthSource {
  fetchEtlCntrl(): Promise<unknown>;
  fetchEd001(): Promise<unknown>;
  fetchEd006(): Promise<unknown>;
}

export interface HospitalRef {
  id: number;
  short_code: string;
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

export interface IngestStore {
  getLatestCapturedAt(): Promise<Date | null>;
  getHospitalsByShortCode(): Promise<Map<string, HospitalRef>>;
  ensureCountryHospital(shortCode: string): Promise<HospitalRef>;
  insertEdSnapshots(rows: EdSnapshotInsert[]): Promise<void>;
  insertEdTriageSnapshots(rows: EdTriageSnapshotInsert[]): Promise<void>;
  logPoll(status: "ingested" | "skipped_no_new_data" | "error", detail?: string): Promise<void>;
}

export type IngestResult =
  | { status: "ingested" }
  | { status: "skipped_no_new_data" }
  | { status: "error"; detail: string };

/**
 * Orchestrates one poll cycle: check for new data, fetch the rest of the
 * endpoints, resolve hospital ids (auto-registering country hospitals seen
 * for the first time), and persist. Never throws — an unexpected shape or a
 * network failure is logged and reported, not allowed to crash the cron job
 * (this is an undocumented third-party endpoint that can change without
 * notice).
 */
export async function runIngest(source: SaHealthSource, store: IngestStore): Promise<IngestResult> {
  try {
    const [sourceCurrDtm, previousCapturedAt] = await Promise.all([
      source.fetchEtlCntrl().then(mapEtlCntrl),
      store.getLatestCapturedAt(),
    ]);

    if (!shouldIngest(previousCapturedAt, sourceCurrDtm)) {
      await store.logPoll("skipped_no_new_data", `source CURR_DTM ${sourceCurrDtm.toISOString()} not newer`);
      return { status: "skipped_no_new_data" };
    }

    const [ed001Raw, ed006Raw] = await Promise.all([source.fetchEd001(), source.fetchEd006()]);
    const ed001 = mapEd001(ed001Raw);
    const ed006 = mapEd006(ed006Raw);

    const hospitals = await store.getHospitalsByShortCode();
    const capturedAt = sourceCurrDtm.toISOString();

    const resolveHospitalId = async (shortCode: string): Promise<number> => {
      const existing = hospitals.get(shortCode);
      if (existing) return existing.id;
      const created = await store.ensureCountryHospital(shortCode);
      hospitals.set(shortCode, created);
      return created.id;
    };

    const snapshotRows: EdSnapshotInsert[] = [];
    for (const row of ed001) {
      const hospitalId = await resolveHospitalId(row.hospitalShortCode);
      snapshotRows.push({
        hospital_id: hospitalId,
        captured_at: capturedAt,
        expected_arrivals: row.expectedArrivals,
        waiting_to_be_seen: row.waitingToBeSeen,
        com_treat: row.commencedTreatment,
        capacity: row.capacity,
        avg_wait_minutes: row.avgWaitMinutesNonUrgent,
      });
    }

    const triageRows: EdTriageSnapshotInsert[] = [];
    for (const row of ed006) {
      const hospitalId = await resolveHospitalId(row.hospitalShortCode);
      triageRows.push({
        hospital_id: hospitalId,
        captured_at: capturedAt,
        triage_category: row.triageCategory,
        waiting_to_be_seen: row.waitingToBeSeen,
        waiting_over_threshold: row.waitingOverThreshold,
        alert_raw: row.alertRaw,
        other: row.other,
        total: row.total,
      });
    }

    await store.insertEdSnapshots(snapshotRows);
    await store.insertEdTriageSnapshots(triageRows);
    await store.logPoll("ingested", `captured_at=${capturedAt} hospitals=${snapshotRows.length}`);
    return { status: "ingested" };
  } catch (err) {
    const detail = errorMessage(err);
    await store.logPoll("error", detail);
    return { status: "error", detail };
  }
}

/**
 * Supabase's errors (PostgrestError, AuthError, etc.) are plain objects with
 * a `message` field, not `Error` instances — `String(err)` on those collapses
 * to the useless "[object Object]", which is exactly the failure mode this
 * function exists to avoid.
 */
function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "object" && err !== null && "message" in err && typeof err.message === "string") {
    return err.message;
  }
  return String(err);
}
