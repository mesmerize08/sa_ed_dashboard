import { describe, expect, test } from "vitest";
import { compareToBaseline } from "./baseline";

describe("compareToBaseline", () => {
  test("reports insufficient data below the minimum sample threshold", () => {
    const result = compareToBaseline(60, 40, 3, { minSamples: 4 });
    expect(result.status).toBe("insufficient-data");
    expect(result.label).toBe("Not enough data yet");
  });

  test("treats values within the average band as about average", () => {
    // baseline 100, band 15% -> [85, 115] counts as "about average"
    expect(compareToBaseline(110, 100, 10).status).toBe("about-average");
    expect(compareToBaseline(90, 100, 10).status).toBe("about-average");
  });

  test("treats a value just inside the band boundary as about average", () => {
    expect(compareToBaseline(115, 100, 10).status).toBe("about-average");
    expect(compareToBaseline(85, 100, 10).status).toBe("about-average");
  });

  test("treats a value just outside the band as busier", () => {
    expect(compareToBaseline(116, 100, 10).status).toBe("busier");
    expect(compareToBaseline(116, 100, 10).label).toBe("Busier than usual");
  });

  test("treats a value just outside the band as quieter", () => {
    expect(compareToBaseline(84, 100, 10).status).toBe("quieter");
    expect(compareToBaseline(84, 100, 10).label).toBe("Quieter than usual");
  });

  test("treats any positive value against a zero baseline as busier", () => {
    expect(compareToBaseline(5, 0, 10).status).toBe("busier");
  });

  test("treats zero against a zero baseline as about average", () => {
    expect(compareToBaseline(0, 0, 10).status).toBe("about-average");
  });
});
