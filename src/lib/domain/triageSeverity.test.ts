import { describe, expect, test } from "vitest";
import { highAcuityBreachLabel, type TriageCategorySignal } from "./triageSeverity";

describe("highAcuityBreachLabel", () => {
  test("returns null when there are no category 1-2 signals at all", () => {
    const signals: TriageCategorySignal[] = [
      { category: 3, currentWot: 5, baselineWot: 1, sampleSize: 10 },
    ];
    expect(highAcuityBreachLabel(signals)).toBeNull();
  });

  test("returns null when category 1-2 breaches are about average", () => {
    const signals: TriageCategorySignal[] = [
      { category: 1, currentWot: 1, baselineWot: 1, sampleSize: 10 },
      { category: 2, currentWot: 2, baselineWot: 2, sampleSize: 10 },
    ];
    expect(highAcuityBreachLabel(signals)).toBeNull();
  });

  test("returns null when there isn't enough history for category 1-2 yet", () => {
    const signals: TriageCategorySignal[] = [
      { category: 1, currentWot: 5, baselineWot: 1, sampleSize: 1 },
    ];
    expect(highAcuityBreachLabel(signals)).toBeNull();
  });

  test("flags when category 2 is breaching threshold more than usual", () => {
    const signals: TriageCategorySignal[] = [
      { category: 2, currentWot: 5, baselineWot: 1, sampleSize: 10 },
    ];
    expect(highAcuityBreachLabel(signals)).toBe(
      "More Category 1-2 patients waiting longer than the clinical target than usual right now",
    );
  });

  test("ignores category 3-5 breaches entirely, even if severe", () => {
    const signals: TriageCategorySignal[] = [
      { category: 4, currentWot: 20, baselineWot: 1, sampleSize: 10 },
    ];
    expect(highAcuityBreachLabel(signals)).toBeNull();
  });
});
