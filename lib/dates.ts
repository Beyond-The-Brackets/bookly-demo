export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;

export function addMinutes(date: Date, minutes: number) {
  return new Date(date.getTime() + minutes * MINUTE_MS);
}

export function hoursBetween(from: Date, to: Date) {
  return (to.getTime() - from.getTime()) / HOUR_MS;
}

function zonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts: Record<string, number> = {};
  for (const part of formatter.formatToParts(date)) {
    if (part.type !== "literal") parts[part.type] = Number(part.value);
  }
  return parts;
}

/** Offset of `timeZone` from UTC at the given instant, in minutes. */
export function getTimeZoneOffset(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  const instant = Math.floor(date.getTime() / 1000) * 1000;
  return Math.round((asUtc - instant) / MINUTE_MS);
}

/** Converts a wall-clock time in `timeZone` (e.g. "2024-05-02", "09:30") to a UTC Date. */
export function zonedTimeToUtc(dateKey: string, time: string, timeZone: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const wallClock = Date.UTC(year, month - 1, day, hours, minutes);

  const firstOffset = getTimeZoneOffset(new Date(wallClock), timeZone);
  let utc = wallClock - firstOffset * MINUTE_MS;
  const secondOffset = getTimeZoneOffset(new Date(utc), timeZone);
  if (secondOffset !== firstOffset) {
    utc = wallClock - secondOffset * MINUTE_MS;
  }
  return new Date(utc);
}

/** "YYYY-MM-DD" for the calendar day of `date` in `timeZone`. */
export function toDateKey(date: Date, timeZone: string) {
  const p = zonedParts(date, timeZone);
  return [
    String(p.year).padStart(4, "0"),
    String(p.month).padStart(2, "0"),
    String(p.day).padStart(2, "0"),
  ].join("-");
}

export function addDays(dateKey: string, days: number) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function weekdayOf(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}

export function upcomingDateKeys(from: Date, timeZone: string, count: number) {
  const first = toDateKey(from, timeZone);
  return Array.from({ length: count }, (_, i) => addDays(first, i));
}
