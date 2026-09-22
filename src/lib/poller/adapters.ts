import type { SupabaseClient } from "@supabase/supabase-js";
import { saHealthClient } from "../sahealth/client";
import {
  ensureCountryHospital,
  getHospitalsByShortCode,
  getLatestCapturedAt,
  insertEdSnapshots,
  insertEdTriageSnapshots,
  logPoll,
} from "../db/queries";
import type { IngestStore, SaHealthSource } from "./ingest";

export const liveSource: SaHealthSource = {
  fetchEtlCntrl: () => saHealthClient.fetchEtlCntrl(),
  fetchEd001: () => saHealthClient.fetchEd001(),
  fetchEd006: () => saHealthClient.fetchEd006(),
};

export function createLiveStore(db: SupabaseClient): IngestStore {
  return {
    getLatestCapturedAt: () => getLatestCapturedAt(db),
    getHospitalsByShortCode: () => getHospitalsByShortCode(db),
    ensureCountryHospital: (shortCode) => ensureCountryHospital(db, shortCode),
    insertEdSnapshots: (rows) => insertEdSnapshots(db, rows),
    insertEdTriageSnapshots: (rows) => insertEdTriageSnapshots(db, rows),
    logPoll: (status, detail) => logPoll(db, status, detail),
  };
}
