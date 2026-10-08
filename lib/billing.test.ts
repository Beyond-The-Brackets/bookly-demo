import { describe, expect, it } from "vitest";

import { cancellationFee, cancellationRate, refundAmount } from "./billing";

const startsAt = new Date("2024-05-10T15:00:00Z");
const hoursBefore = (h: number) => new Date(startsAt.getTime() - h * 3_600_000);

describe("cancellationFee", () => {
  it("is free 24 hours or more before the appointment", () => {
    expect(cancellationFee({ priceCents: 9000, startsAt, cancelledAt: hoursBefore(48) })).toBe(0);
    expect(cancellationFee({ priceCents: 9000, startsAt, cancelledAt: hoursBefore(24) })).toBe(0);
  });

  it("charges half between 24 and 2 hours before", () => {
    expect(cancellationFee({ priceCents: 9000, startsAt, cancelledAt: hoursBefore(23.5) })).toBe(4500);
    expect(cancellationFee({ priceCents: 9000, startsAt, cancelledAt: hoursBefore(2) })).toBe(4500);
    expect(cancellationFee({ priceCents: 4999, startsAt, cancelledAt: hoursBefore(10) })).toBe(2500);
  });

  it("charges the full price in the last 2 hours and after the start", () => {
    expect(cancellationFee({ priceCents: 9000, startsAt, cancelledAt: hoursBefore(1) })).toBe(9000);
    expect(cancellationFee({ priceCents: 9000, startsAt, cancelledAt: hoursBefore(-1) })).toBe(9000);
  });

  it("never charges for free sessions and accepts ISO strings", () => {
    expect(cancellationFee({ priceCents: 0, startsAt, cancelledAt: hoursBefore(1) })).toBe(0);
    expect(cancellationFee({ priceCents: 9000, startsAt: startsAt.toISOString(), cancelledAt: hoursBefore(5) })).toBe(4500);
  });

  it("exposes the rate and the refund", () => {
    expect(cancellationRate(30)).toBe(0);
    expect(cancellationRate(3)).toBe(0.5);
    expect(cancellationRate(0)).toBe(1);
    expect(refundAmount(9000, 4500)).toBe(4500);
    expect(refundAmount(9000, 12000)).toBe(0);
  });
});
