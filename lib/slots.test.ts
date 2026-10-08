import { describe, expect, it } from "vitest";

import { generateSlots, isSlotAvailable } from "./slots";

const windows = [
  { weekday: 1, start_time: "09:00:00", end_time: "12:00:00" },
  { weekday: 1, start_time: "14:00:00", end_time: "15:00:00" },
];

// Monday 2024-05-06, Europe/Paris (UTC+2)
const base = {
  dateKey: "2024-05-06",
  timeZone: "Europe/Paris",
  windows,
  now: new Date("2024-05-01T00:00:00Z"),
};

const times = (slots: Date[]) => slots.map((s) => s.toISOString().slice(11, 16));

describe("slots", () => {
  it("generates slots that fit inside each availability window", () => {
    const slots = generateSlots({ ...base, durationMinutes: 60, busy: [] });
    expect(times(slots)).toEqual(["07:00", "07:30", "08:00", "08:30", "09:00", "12:00"]);
  });

  it("skips slots that overlap an existing booking", () => {
    const busy = [{ starts_at: "2024-05-06T08:00:00Z", ends_at: "2024-05-06T09:00:00Z" }];
    const slots = generateSlots({ ...base, durationMinutes: 60, busy });
    expect(times(slots)).toEqual(["07:00", "09:00", "12:00"]);
  });

  it("respects the minimum notice and days without availability", () => {
    const now = new Date("2024-05-06T06:45:00Z");
    expect(times(generateSlots({ ...base, now, durationMinutes: 30, busy: [] }))).toEqual([
      "09:00",
      "09:30",
      "12:00",
      "12:30",
    ]);
    expect(generateSlots({ ...base, dateKey: "2024-05-07", durationMinutes: 30, busy: [] })).toEqual([]);
  });

  it("checks a requested start time", () => {
    const options = { timeZone: base.timeZone, windows, now: base.now, durationMinutes: 60, busy: [] };
    expect(isSlotAvailable(new Date("2024-05-06T07:00:00Z"), options)).toBe(true);
    expect(isSlotAvailable(new Date("2024-05-06T07:10:00Z"), options)).toBe(false);
    expect(isSlotAvailable(new Date("2024-05-06T09:30:00Z"), options)).toBe(false);
    expect(isSlotAvailable(new Date("2024-05-07T07:00:00Z"), options)).toBe(false);
  });
});
