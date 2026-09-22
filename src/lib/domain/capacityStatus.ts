export type CapacityLevel = "green" | "amber" | "red" | "white";

/**
 * Occupancy % of general treatment areas, per SA Health's "ED capacity status"
 * definition (the one that colours the primary hospital status table) —
 * distinct from the source's separate, ambiguously-worded "ED status" concept,
 * which this project deliberately does not surface.
 */
export function occupancyPercent(patients: number, capacityTotal: number): number {
  if (capacityTotal === 0) return 0;
  return (patients / capacityTotal) * 100;
}

export function capacityLevel(occupancy: number): CapacityLevel {
  if (occupancy < 80) return "green";
  if (occupancy < 95) return "amber";
  if (occupancy < 125) return "red";
  return "white";
}

const LABELS: Record<CapacityLevel, string> = {
  green: "Not busy",
  amber: "Moderately busy",
  red: "Very busy",
  white: "At capacity",
};

export function capacityLabel(level: CapacityLevel): string {
  return LABELS[level];
}
