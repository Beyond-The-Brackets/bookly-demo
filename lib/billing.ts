import { hoursBetween } from "@/lib/dates";

export interface CancellationTier {
  minHoursBefore: number;
  rate: number;
}

export const CANCELLATION_TIERS: CancellationTier[] = [
  { minHoursBefore: 24, rate: 0 },
  { minHoursBefore: 2, rate: 0.5 },
  { minHoursBefore: Number.NEGATIVE_INFINITY, rate: 1 },
];

export interface CancellationInput {
  priceCents: number;
  startsAt: Date | string;
  cancelledAt?: Date;
}

export function cancellationRate(hoursBefore: number) {
  const tier = CANCELLATION_TIERS.find((t) => hoursBefore >= t.minHoursBefore);
  return tier ? tier.rate : 1;
}

export function cancellationFee({
  priceCents,
  startsAt,
  cancelledAt = new Date(),
}: CancellationInput) {
  if (!Number.isFinite(priceCents) || priceCents <= 0) return 0;
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const hoursBefore = hoursBetween(cancelledAt, start);
  return Math.round(priceCents * cancellationRate(hoursBefore));
}

export function refundAmount(priceCents: number, feeCents: number) {
  return Math.max(0, priceCents - feeCents);
}

export const CANCELLATION_POLICY =
  "Free cancellation up to 24 hours before your appointment. 50% is charged between 24 and 2 hours before, and the full price after that.";
