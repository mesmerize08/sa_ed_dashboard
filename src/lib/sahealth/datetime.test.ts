import { describe, expect, test } from "vitest";
import { parseAdelaideDateTime } from "./datetime";

describe("parseAdelaideDateTime", () => {
  test("parses a standard-time (ACST, UTC+9:30) timestamp correctly", () => {
    // Late September is before DST starts (first Sunday of October in SA).
    const result = parseAdelaideDateTime("22/09/2026 20:00");
    expect(result.toISOString()).toBe("2026-09-22T10:30:00.000Z");
  });

  test("parses a daylight-saving (ACDT, UTC+10:30) timestamp correctly", () => {
    // January is within the ACDT period.
    const result = parseAdelaideDateTime("15/01/2026 14:00");
    expect(result.toISOString()).toBe("2026-01-15T03:30:00.000Z");
  });

  test("throws on an unrecognised format instead of silently misparsing", () => {
    expect(() => parseAdelaideDateTime("2026-09-22 20:00")).toThrow();
  });
});
