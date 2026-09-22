const SA_HEALTH_DATETIME = /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/;

/**
 * SA Health's dashboard timestamps (e.g. "22/09/2026 20:00") are DD/MM/YYYY
 * wall-clock time in Australia/Adelaide, which alternates between ACST
 * (UTC+9:30) and ACDT (UTC+10:30) around the October/April DST boundary.
 * Getting this wrong silently would corrupt every hour-of-day/day-of-week
 * baseline computed from stored data, so we resolve the real UTC instant via
 * the IANA tz database rather than assuming a fixed offset.
 */
export function parseAdelaideDateTime(raw: string): Date {
  const match = SA_HEALTH_DATETIME.exec(raw);
  if (!match) {
    throw new Error(`Unrecognised SA Health datetime: "${raw}"`);
  }
  const [, dd, mm, yyyy, hh, min] = match;
  const day = Number(dd);
  const month = Number(mm);
  const year = Number(yyyy);
  const hour = Number(hh);
  const minute = Number(min);
  const wallClockUtcMillis = Date.UTC(year, month - 1, day, hour, minute);

  // Fixed-point iteration: guess the offset, correct, re-check. Two passes
  // are enough in practice since Adelaide's offset never changes twice
  // within the width of one correction.
  let instant = wallClockUtcMillis;
  for (let i = 0; i < 2; i++) {
    const offsetMinutes = adelaideOffsetMinutesAt(instant);
    const corrected = wallClockUtcMillis - offsetMinutes * 60_000;
    if (corrected === instant) break;
    instant = corrected;
  }
  return new Date(instant);
}

function adelaideOffsetMinutesAt(instantMillis: number): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Australia/Adelaide",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(new Date(instantMillis));
  const value = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  const localAsUtcMillis = Date.UTC(
    Number(value("year")),
    Number(value("month")) - 1,
    Number(value("day")),
    Number(value("hour")),
    Number(value("minute")),
    Number(value("second")),
  );
  return (localAsUtcMillis - instantMillis) / 60_000;
}
