import { describe, expect, test } from "vitest";
import { buildHospitalSummary } from "./summary";

const HOSPITAL = { id: 1, shortCode: "FMC", fullName: "Flinders Medical Centre" };

describe("buildHospitalSummary", () => {
  test("composes capacity level, wait label, and about-average baseline for a typical snapshot", () => {
    const summary = buildHospitalSummary({
      hospital: HOSPITAL,
      snapshot: {
        capturedAt: "2026-09-22T10:30:00.000Z",
        waitingToBeSeen: 33,
        comTreat: 33,
        capacity: 100,
        avgWaitMinutes: 100.44,
      },
      occupancyBaseline: { avgOccupancyPercent: 66, sampleSize: 20 },
      triageRows: [],
      triageBaselines: [],
    });

    expect(summary.capacityLevel).toBe("green");
    expect(summary.capacityLabel).toBe("Not busy");
    expect(summary.occupancyPercent).toBe(66);
    expect(summary.nonUrgentWaitLabel).toBe("1h 40m");
    expect(summary.busierQuieter.status).toBe("about-average");
    expect(summary.triageBreachLabel).toBeNull();
  });

  test("flags busier-than-usual occupancy against its baseline", () => {
    const summary = buildHospitalSummary({
      hospital: HOSPITAL,
      snapshot: {
        capturedAt: "2026-09-22T10:30:00.000Z",
        waitingToBeSeen: 60,
        comTreat: 60,
        capacity: 100,
        avgWaitMinutes: 45,
      },
      occupancyBaseline: { avgOccupancyPercent: 60, sampleSize: 20 },
      triageRows: [],
      triageBaselines: [],
    });

    expect(summary.occupancyPercent).toBe(120);
    expect(summary.busierQuieter.status).toBe("busier");
  });

  test("flags a category 1-2 triage breach using WOT against baseline", () => {
    const summary = buildHospitalSummary({
      hospital: HOSPITAL,
      snapshot: {
        capturedAt: "2026-09-22T10:30:00.000Z",
        waitingToBeSeen: 10,
        comTreat: 10,
        capacity: 100,
        avgWaitMinutes: 30,
      },
      occupancyBaseline: { avgOccupancyPercent: 20, sampleSize: 20 },
      triageRows: [{ category: 2, waitingOverThreshold: 5 }],
      triageBaselines: [{ category: 2, avgWot: 1, sampleSize: 20 }],
    });

    expect(summary.triageBreachLabel).toBe(
      "More Category 1-2 patients waiting longer than the clinical target than usual right now",
    );
  });

  test("does not flag a triage breach when there is no baseline for that category yet", () => {
    const summary = buildHospitalSummary({
      hospital: HOSPITAL,
      snapshot: {
        capturedAt: "2026-09-22T10:30:00.000Z",
        waitingToBeSeen: 10,
        comTreat: 10,
        capacity: 100,
        avgWaitMinutes: 30,
      },
      occupancyBaseline: { avgOccupancyPercent: 20, sampleSize: 20 },
      triageRows: [{ category: 1, waitingOverThreshold: 5 }],
      triageBaselines: [],
    });

    expect(summary.triageBreachLabel).toBeNull();
  });
});
