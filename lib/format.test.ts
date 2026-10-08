import { describe, expect, it } from "vitest";

import {
  formatBookingDate,
  formatBookingDateTime,
  formatBookingRange,
  formatDuration,
  formatPrice,
} from "./format";

const normalize = (value: string) => value.replace(/\s/g, " ");

describe("format", () => {
  const start = "2024-05-06T14:00:00Z";
  const end = "2024-05-06T15:30:00Z";

  it("formats booking dates in the practitioner's time zone", () => {
    expect(formatBookingDate(start, "America/New_York")).toBe("Monday, May 6");
    expect(formatBookingDate("2024-05-07T02:00:00Z", "America/Los_Angeles")).toBe("Monday, May 6");
  });

  it("formats a time range with the time zone label", () => {
    expect(normalize(formatBookingRange(start, end, "America/New_York"))).toBe("10:00 AM – 11:30 AM EDT");
    expect(normalize(formatBookingDateTime(start, "UTC"))).toBe("Monday, May 6 at 2:00 PM UTC");
  });

  it("formats prices and durations", () => {
    expect(formatPrice(9000)).toBe("$90");
    expect(formatPrice(4550)).toBe("$45.50");
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });
});
