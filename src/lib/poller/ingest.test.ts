import { describe, expect, test, vi } from "vitest";
import { runIngest, type IngestStore, type SaHealthSource } from "./ingest";

const ETL_RAW = [{ ID: "1", CURR_DTM: "22/09/2026 20:00" }, { ID: "", CURR_DTM: null }];
const ED001_ROW = {
  DTM: "2026-09-22T20:00:00",
  HOSP_SHORT: "FMC",
  EA: "10",
  WTBS: "33",
  COM_TREAT: "79",
  CAP: "63",
  AVG_WAIT: "100.44",
};
const PADDING_ROW = { DTM: null, HOSP_SHORT: null, EA: null, WTBS: null, COM_TREAT: null, CAP: null, AVG_WAIT: null };

function makeSource(overrides: Partial<SaHealthSource> = {}): SaHealthSource {
  return {
    fetchEtlCntrl: vi.fn().mockResolvedValue(ETL_RAW),
    fetchEd001: vi.fn().mockResolvedValue([ED001_ROW, PADDING_ROW]),
    fetchEd006: vi.fn().mockResolvedValue([]),
    ...overrides,
  };
}

function makeStore(overrides: Partial<IngestStore> = {}): IngestStore {
  return {
    getLatestCapturedAt: vi.fn().mockResolvedValue(null),
    getHospitalsByShortCode: vi.fn().mockResolvedValue(new Map([["FMC", { id: 1, short_code: "FMC" }]])),
    ensureCountryHospital: vi.fn().mockResolvedValue({ id: 99, short_code: "Unknown Hospital" }),
    insertEdSnapshots: vi.fn().mockResolvedValue(undefined),
    insertEdTriageSnapshots: vi.fn().mockResolvedValue(undefined),
    logPoll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe("runIngest", () => {
  test("skips ingestion when CURR_DTM has not advanced since the last poll", async () => {
    const source = makeSource();
    const store = makeStore({
      getLatestCapturedAt: vi.fn().mockResolvedValue(new Date("2026-09-22T10:30:00.000Z")),
    });

    const result = await runIngest(source, store);

    expect(result.status).toBe("skipped_no_new_data");
    expect(store.insertEdSnapshots).not.toHaveBeenCalled();
    expect(store.logPoll).toHaveBeenCalledWith("skipped_no_new_data", expect.anything());
  });

  test("ingests new data, mapping a known hospital short code to its existing id", async () => {
    const source = makeSource();
    const store = makeStore();

    const result = await runIngest(source, store);

    expect(result.status).toBe("ingested");
    expect(store.insertEdSnapshots).toHaveBeenCalledWith([
      expect.objectContaining({
        hospital_id: 1,
        captured_at: "2026-09-22T10:30:00.000Z",
        expected_arrivals: 10,
        waiting_to_be_seen: 33,
        com_treat: 79,
        capacity: 63,
        avg_wait_minutes: 100.44,
      }),
    ]);
    expect(store.logPoll).toHaveBeenCalledWith("ingested", expect.anything());
  });

  test("auto-registers a hospital short code not seen before as a country hospital", async () => {
    const source = makeSource({
      fetchEd001: vi.fn().mockResolvedValue([{ ...ED001_ROW, HOSP_SHORT: "Oodnadatta Health Service" }, PADDING_ROW]),
    });
    const store = makeStore({
      getHospitalsByShortCode: vi.fn().mockResolvedValue(new Map()),
    });

    await runIngest(source, store);

    expect(store.ensureCountryHospital).toHaveBeenCalledWith("Oodnadatta Health Service");
    expect(store.insertEdSnapshots).toHaveBeenCalledWith([expect.objectContaining({ hospital_id: 99 })]);
  });

  test("logs an error and resolves without throwing when the source fetch fails", async () => {
    const source = makeSource({
      fetchEtlCntrl: vi.fn().mockRejectedValue(new Error("network down")),
    });
    const store = makeStore();

    const result = await expect(runIngest(source, store)).resolves.toMatchObject({ status: "error" });
    void result;

    expect(store.logPoll).toHaveBeenCalledWith("error", expect.stringContaining("network down"));
    expect(store.insertEdSnapshots).not.toHaveBeenCalled();
  });
});
