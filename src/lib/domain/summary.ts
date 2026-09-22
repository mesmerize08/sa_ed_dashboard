import { capacityLabel, capacityLevel, occupancyPercent } from "./capacityStatus";
import { compareToBaseline } from "./baseline";
import { formatWaitDuration } from "./waitDuration";
import { highAcuityBreachLabel, type TriageCategorySignal } from "./triageSeverity";
import type { HospitalSummary } from "@/types/hospital";

export interface BuildHospitalSummaryInput {
  hospital: { id: number; shortCode: string; fullName: string };
  snapshot: {
    capturedAt: string;
    waitingToBeSeen: number;
    comTreat: number;
    capacity: number;
    avgWaitMinutes: number;
  };
  occupancyBaseline: { avgOccupancyPercent: number; sampleSize: number };
  triageRows: { category: number; waitingOverThreshold: number }[];
  triageBaselines: { category: number; avgWot: number; sampleSize: number }[];
}

/**
 * Composes the already-tested domain functions into the single summary the
 * hospital detail/home views render. Kept separate from the API route so
 * this composition itself is directly testable without a database.
 */
export function buildHospitalSummary(input: BuildHospitalSummaryInput): HospitalSummary {
  const { hospital, snapshot, occupancyBaseline, triageRows, triageBaselines } = input;

  const occupancy = occupancyPercent(snapshot.waitingToBeSeen + snapshot.comTreat, snapshot.capacity);
  const level = capacityLevel(occupancy);

  const busierQuieter = compareToBaseline(
    occupancy,
    occupancyBaseline.avgOccupancyPercent,
    occupancyBaseline.sampleSize,
  );

  const triageSignals: TriageCategorySignal[] = triageRows
    .filter((r) => r.category === 1 || r.category === 2)
    .map((r) => {
      const baseline = triageBaselines.find((b) => b.category === r.category);
      return {
        category: r.category as 1 | 2,
        currentWot: r.waitingOverThreshold,
        baselineWot: baseline?.avgWot ?? 0,
        sampleSize: baseline?.sampleSize ?? 0,
      };
    });

  return {
    id: hospital.id,
    shortCode: hospital.shortCode,
    fullName: hospital.fullName,
    capturedAt: snapshot.capturedAt,
    capacityLevel: level,
    capacityLabel: capacityLabel(level),
    occupancyPercent: occupancy,
    nonUrgentWaitLabel: formatWaitDuration(snapshot.avgWaitMinutes),
    busierQuieter,
    triageBreachLabel: highAcuityBreachLabel(triageSignals),
  };
}
