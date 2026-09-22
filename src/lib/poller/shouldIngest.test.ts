import { describe, expect, test } from "vitest";
import { shouldIngest } from "./shouldIngest";

describe("shouldIngest", () => {
  test("ingests when there is no prior snapshot", () => {
    expect(shouldIngest(null, new Date("2026-09-22T10:30:00Z"))).toBe(true);
  });

  test("does not ingest when the source CURR_DTM is unchanged since the last poll", () => {
    const same = new Date("2026-09-22T10:30:00Z");
    expect(shouldIngest(same, same)).toBe(false);
  });

  test("ingests when the source CURR_DTM has advanced", () => {
    const previous = new Date("2026-09-22T10:00:00Z");
    const current = new Date("2026-09-22T10:30:00Z");
    expect(shouldIngest(previous, current)).toBe(true);
  });

  test("does not ingest when the source CURR_DTM has gone backwards (defensive against source glitches)", () => {
    const previous = new Date("2026-09-22T10:30:00Z");
    const current = new Date("2026-09-22T10:00:00Z");
    expect(shouldIngest(previous, current)).toBe(false);
  });
});
