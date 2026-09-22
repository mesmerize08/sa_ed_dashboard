import { describe, expect, test } from "vitest";
import { formatWaitDuration } from "./waitDuration";

describe("formatWaitDuration", () => {
  test("formats zero minutes", () => {
    expect(formatWaitDuration(0)).toBe("0 min");
  });

  test("formats sub-hour minutes plainly", () => {
    expect(formatWaitDuration(45)).toBe("45 min");
  });

  test("rounds fractional minutes to the nearest whole minute", () => {
    expect(formatWaitDuration(44.6)).toBe("45 min");
  });

  test("formats an hour-plus duration as h/m, rounding minutes first (matches FMC 100.44 -> 1h 40m)", () => {
    expect(formatWaitDuration(100.44)).toBe("1h 40m");
  });

  test("formats a multi-hour duration (matches LMH 191.71 -> 3h 12m)", () => {
    expect(formatWaitDuration(191.71)).toBe("3h 12m");
  });

  test("rolls over into the next hour when rounding pushes minutes to 60", () => {
    expect(formatWaitDuration(59.6)).toBe("1h 0m");
  });
});
