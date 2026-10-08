import { describe, expect, it } from "vitest";

import { addDays, getTimeZoneOffset, toDateKey, upcomingDateKeys, weekdayOf, zonedTimeToUtc } from "./dates";

describe("dates", () => {
  it("converts a wall-clock time in a time zone to UTC", () => {
    expect(zonedTimeToUtc("2024-01-15", "09:30", "America/New_York").toISOString()).toBe("2024-01-15T14:30:00.000Z");
    expect(zonedTimeToUtc("2024-07-15", "09:30", "America/New_York").toISOString()).toBe("2024-07-15T13:30:00.000Z");
    expect(zonedTimeToUtc("2024-07-15", "09:30", "UTC").toISOString()).toBe("2024-07-15T09:30:00.000Z");
  });

  it("handles daylight saving transitions", () => {
    expect(zonedTimeToUtc("2024-03-10", "12:00", "America/New_York").toISOString()).toBe("2024-03-10T16:00:00.000Z");
    expect(getTimeZoneOffset(new Date("2024-03-10T06:00:00Z"), "America/New_York")).toBe(-300);
    expect(getTimeZoneOffset(new Date("2024-03-10T08:00:00Z"), "America/New_York")).toBe(-240);
  });

  it("returns the calendar day in the given time zone", () => {
    const lateEvening = new Date("2024-05-02T03:00:00Z");
    expect(toDateKey(lateEvening, "America/Los_Angeles")).toBe("2024-05-01");
    expect(toDateKey(lateEvening, "Europe/Paris")).toBe("2024-05-02");
  });

  it("walks calendar days across month ends", () => {
    expect(addDays("2024-02-28", 1)).toBe("2024-02-29");
    expect(addDays("2024-12-31", 1)).toBe("2025-01-01");
    expect(weekdayOf("2024-05-06")).toBe(1);
    expect(upcomingDateKeys(new Date("2024-05-31T12:00:00Z"), "UTC", 3)).toEqual([
      "2024-05-31",
      "2024-06-01",
      "2024-06-02",
    ]);
  });
});
