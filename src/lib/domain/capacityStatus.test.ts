import { describe, expect, test } from "vitest";
import { capacityLevel, capacityLabel, occupancyPercent } from "./capacityStatus";

describe("occupancyPercent", () => {
  test("computes patients as a percentage of capacity", () => {
    expect(occupancyPercent(66, 38)).toBeCloseTo(173.68, 1);
  });

  test("returns 0 when capacity is 0 rather than dividing by zero", () => {
    expect(occupancyPercent(5, 0)).toBe(0);
  });
});

describe("capacityLevel", () => {
  test("is green just under 80%", () => {
    expect(capacityLevel(79.9)).toBe("green");
  });

  test("is amber at exactly 80%", () => {
    expect(capacityLevel(80)).toBe("amber");
  });

  test("is amber just under 95%", () => {
    expect(capacityLevel(94.9)).toBe("amber");
  });

  test("is red at exactly 95%", () => {
    expect(capacityLevel(95)).toBe("red");
  });

  test("is red just under 125%", () => {
    expect(capacityLevel(124.9)).toBe("red");
  });

  test("is white at exactly 125%", () => {
    expect(capacityLevel(125)).toBe("white");
  });

  test("is white well above 125%", () => {
    expect(capacityLevel(200)).toBe("white");
  });
});

describe("capacityLabel", () => {
  test("describes green as not busy", () => {
    expect(capacityLabel("green")).toBe("Not busy");
  });

  test("describes amber as moderately busy", () => {
    expect(capacityLabel("amber")).toBe("Moderately busy");
  });

  test("describes red as very busy", () => {
    expect(capacityLabel("red")).toBe("Very busy");
  });

  test("describes white as at capacity", () => {
    expect(capacityLabel("white")).toBe("At capacity");
  });
});
