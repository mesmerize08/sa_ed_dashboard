import { parseAdelaideDateTime } from "./datetime";
import {
  Ed001ResponseSchema,
  Ed006ResponseSchema,
  EtlCntrlResponseSchema,
} from "./schemas";

function requireNumber(value: string | null, field: string): number {
  if (value === null || value.trim() === "") {
    throw new Error(`Expected a numeric value for "${field}" but got ${JSON.stringify(value)}`);
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    throw new Error(`Could not parse "${field}" as a number: ${JSON.stringify(value)}`);
  }
  return n;
}

export function mapEtlCntrl(raw: unknown): Date {
  const rows = EtlCntrlResponseSchema.parse(raw);
  const first = rows[0];
  if (!first?.CURR_DTM) {
    throw new Error("ED_Etl_Cntrl response had no CURR_DTM in its first row");
  }
  return parseAdelaideDateTime(first.CURR_DTM);
}

export interface Ed001Record {
  hospitalShortCode: string;
  expectedArrivals: number;
  waitingToBeSeen: number;
  commencedTreatment: number;
  capacity: number;
  /** SA Health's AVG_WAIT: non-urgent (triage 3-5) cases only, not an all-patient average. */
  avgWaitMinutesNonUrgent: number;
}

export function mapEd001(raw: unknown): Ed001Record[] {
  const rows = Ed001ResponseSchema.parse(raw);
  return rows
    .filter((row) => row.HOSP_SHORT !== null && row.HOSP_SHORT.trim() !== "")
    .map((row) => ({
      hospitalShortCode: row.HOSP_SHORT!.trim(),
      expectedArrivals: requireNumber(row.EA, "EA"),
      waitingToBeSeen: requireNumber(row.WTBS, "WTBS"),
      commencedTreatment: requireNumber(row.COM_TREAT, "COM_TREAT"),
      capacity: requireNumber(row.CAP, "CAP"),
      avgWaitMinutesNonUrgent: requireNumber(row.AVG_WAIT, "AVG_WAIT"),
    }));
}

export interface Ed006Record {
  hospitalShortCode: string;
  triageCategory: number;
  waitingToBeSeen: number;
  waitingOverThreshold: number;
  alertRaw: number;
  other: number;
  total: number;
}

export function mapEd006(raw: unknown): Ed006Record[] {
  const rows = Ed006ResponseSchema.parse(raw);
  return rows
    .filter((row) => row.HOSP_SHORT !== null && row.HOSP_SHORT.trim() !== "")
    .map((row) => ({
      hospitalShortCode: row.HOSP_SHORT!.trim(),
      triageCategory: requireNumber(row.CAT, "CAT"),
      waitingToBeSeen: requireNumber(row.WTS, "WTS"),
      waitingOverThreshold: requireNumber(row.WOT, "WOT"),
      alertRaw: requireNumber(row.ALERT, "ALERT"),
      other: requireNumber(row.OTH, "OTH"),
      total: requireNumber(row.TOT, "TOT"),
    }))
    // Confirmed against live data: some country hospitals report CAT -99 as
    // a sentinel for unclassified/missing triage category rather than
    // omitting the row. Not a real triage category (1-5), so it's dropped
    // here rather than stored.
    .filter((record) => record.triageCategory >= 1 && record.triageCategory <= 5);
}
