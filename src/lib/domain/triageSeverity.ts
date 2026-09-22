import { compareToBaseline } from "./baseline";

export interface TriageCategorySignal {
  category: 1 | 2 | 3 | 4 | 5;
  /** Current count of patients in this category who've exceeded the clinical wait threshold (WOT). */
  currentWot: number;
  /** Historical average WOT for this hospital/category at this hour-of-day/day-of-week slot. */
  baselineWot: number;
  sampleSize: number;
}

const HIGH_ACUITY_CATEGORIES = new Set([1, 2]);

/**
 * Flags when triage categories 1-2 (Resuscitation/Emergency) are breaching
 * their clinical wait-time threshold more than usual for this hospital at
 * this time — the triage-severity differentiator from the plan, built on
 * SA Health's own WOT ("Waiting Over Threshold") field rather than raw
 * patient counts.
 */
export function highAcuityBreachLabel(signals: TriageCategorySignal[]): string | null {
  const breaching = signals
    .filter((s) => HIGH_ACUITY_CATEGORIES.has(s.category))
    .some((s) => compareToBaseline(s.currentWot, s.baselineWot, s.sampleSize).status === "busier");

  if (!breaching) return null;
  return "More Category 1-2 patients waiting longer than the clinical target than usual right now";
}
