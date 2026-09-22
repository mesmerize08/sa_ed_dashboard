export type BaselineStatus = "busier" | "quieter" | "about-average" | "insufficient-data";

export interface BaselineComparison {
  status: BaselineStatus;
  label: string;
}

const LABELS: Record<BaselineStatus, string> = {
  busier: "Busier than usual",
  quieter: "Quieter than usual",
  "about-average": "About average for this time",
  "insufficient-data": "Not enough data yet",
};

/**
 * Compares a current metric (e.g. patients waiting) against the historical
 * baseline for the same hour-of-day/day-of-week slot — the Google
 * Popular-Times-style differentiator called for in the plan. A percentage
 * band around the baseline avoids flapping between "busier"/"quieter" on
 * noise, and a minimum sample count avoids drawing a baseline from too
 * little history.
 */
export function compareToBaseline(
  current: number,
  baselineAverage: number,
  sampleSize: number,
  options: { minSamples?: number; aboutAverageBandPercent?: number } = {},
): BaselineComparison {
  const minSamples = options.minSamples ?? 4;
  const bandPercent = options.aboutAverageBandPercent ?? 15;

  if (sampleSize < minSamples) {
    return { status: "insufficient-data", label: LABELS["insufficient-data"] };
  }

  if (baselineAverage === 0) {
    const status: BaselineStatus = current > 0 ? "busier" : "about-average";
    return { status, label: LABELS[status] };
  }

  const percentDiff = ((current - baselineAverage) / baselineAverage) * 100;
  const status: BaselineStatus =
    percentDiff > bandPercent ? "busier" : percentDiff < -bandPercent ? "quieter" : "about-average";
  return { status, label: LABELS[status] };
}
