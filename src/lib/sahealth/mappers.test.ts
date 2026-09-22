import { describe, expect, test } from "vitest";
import { mapEd001, mapEd006, mapEtlCntrl } from "./mappers";

describe("mapEtlCntrl", () => {
  test("extracts the CURR_DTM from the first row and ignores the trailing null row", () => {
    const raw = [
      { ID: "5700", CURR_DTM: "22/09/2026 20:00" },
      { ID: "", CURR_DTM: null },
    ];
    expect(mapEtlCntrl(raw)).toEqual(new Date("2026-09-22T10:30:00.000Z"));
  });

  test("throws if the first row has no CURR_DTM", () => {
    expect(() => mapEtlCntrl([{ ID: "", CURR_DTM: null }])).toThrow();
  });
});

describe("mapEd001", () => {
  test("maps real-shaped rows to typed records, coercing numeric strings", () => {
    const raw = [
      {
        DTM: "2026-09-22T20:00:00",
        HOSP_SHORT: "FMC",
        EA: "10",
        WTBS: "33",
        COM_TREAT: "79",
        CAP: "63",
        UNKNOWN1: "",
        AVG_WAIT: "100.44",
        UNKNOWN2: "\r",
      },
      // Source always appends a trailing all-null padding row.
      {
        DTM: null,
        HOSP_SHORT: null,
        EA: null,
        WTBS: null,
        COM_TREAT: null,
        CAP: null,
        UNKNOWN1: null,
        AVG_WAIT: null,
        UNKNOWN2: null,
      },
    ];

    expect(mapEd001(raw)).toEqual([
      {
        hospitalShortCode: "FMC",
        expectedArrivals: 10,
        waitingToBeSeen: 33,
        commencedTreatment: 79,
        capacity: 63,
        avgWaitMinutesNonUrgent: 100.44,
      },
    ]);
  });

  test("drops rows with a blank hospital code (the trailing padding row)", () => {
    const raw = [
      { DTM: null, HOSP_SHORT: "", EA: null, WTBS: null, COM_TREAT: null, CAP: null, AVG_WAIT: null },
    ];
    expect(mapEd001(raw)).toEqual([]);
  });
});

describe("mapEd006", () => {
  test("maps triage category rows and coerces the category number", () => {
    const raw = [
      { HOSP_SHORT: "FMC", CAT: "2", WTS: "3", WOT: "1", ALERT: "1", OTH: "18", TOT: "21" },
      { HOSP_SHORT: "", CAT: null, WTS: null, WOT: null, ALERT: null, OTH: null, TOT: null },
    ];

    expect(mapEd006(raw)).toEqual([
      {
        hospitalShortCode: "FMC",
        triageCategory: 2,
        waitingToBeSeen: 3,
        waitingOverThreshold: 1,
        alertRaw: 1,
        other: 18,
        total: 21,
      },
    ]);
  });
});
