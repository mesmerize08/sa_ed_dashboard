import type { CapacityLevel } from "@/lib/domain/capacityStatus";
import type { BaselineStatus } from "@/lib/domain/baseline";

export interface HospitalListItem {
  id: number;
  shortCode: string;
  fullName: string;
  type: "metro" | "country";
}

export interface HospitalSummary {
  id: number;
  shortCode: string;
  fullName: string;
  capturedAt: string;
  capacityLevel: CapacityLevel;
  capacityLabel: string;
  occupancyPercent: number;
  /** Formatted duration, always paired with the non-urgent-only caveat in the UI. */
  nonUrgentWaitLabel: string;
  busierQuieter: { status: BaselineStatus; label: string };
  triageBreachLabel: string | null;
}

export interface TrendPoint {
  capturedAt: string;
  occupancyPercent: number;
  avgWaitMinutes: number;
}

export type TrendRange = "1d" | "1w";
