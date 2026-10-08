import { addMinutes, toDateKey, weekdayOf, zonedTimeToUtc } from "@/lib/dates";
import type { Availability, BusyInterval } from "@/lib/types";

export type AvailabilityWindow = Pick<Availability, "weekday" | "start_time" | "end_time">;

export interface SlotOptions {
  dateKey: string;
  timeZone: string;
  durationMinutes: number;
  windows: AvailabilityWindow[];
  busy: BusyInterval[];
  now?: Date;
  stepMinutes?: number;
  minNoticeMinutes?: number;
}

export const DEFAULT_STEP_MINUTES = 30;
export const DEFAULT_MIN_NOTICE_MINUTES = 120;

export function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && bStart < aEnd;
}

export function generateSlots({
  dateKey,
  timeZone,
  durationMinutes,
  windows,
  busy,
  now = new Date(),
  stepMinutes = DEFAULT_STEP_MINUTES,
  minNoticeMinutes = DEFAULT_MIN_NOTICE_MINUTES,
}: SlotOptions): Date[] {
  const weekday = weekdayOf(dateKey);
  const earliest = addMinutes(now, minNoticeMinutes);
  const busyRanges = busy.map((b) => [new Date(b.starts_at), new Date(b.ends_at)] as const);
  const slots: Date[] = [];

  for (const window of windows.filter((w) => w.weekday === weekday)) {
    const windowStart = zonedTimeToUtc(dateKey, window.start_time, timeZone);
    const windowEnd = zonedTimeToUtc(dateKey, window.end_time, timeZone);

    for (
      let start = windowStart;
      addMinutes(start, durationMinutes) <= windowEnd;
      start = addMinutes(start, stepMinutes)
    ) {
      const end = addMinutes(start, durationMinutes);
      if (start < earliest) continue;
      if (busyRanges.some(([bStart, bEnd]) => overlaps(start, end, bStart, bEnd))) continue;
      slots.push(start);
    }
  }

  return slots.sort((a, b) => a.getTime() - b.getTime());
}

export function isSlotAvailable(
  startsAt: Date,
  options: Omit<SlotOptions, "dateKey">
) {
  const dateKey = toDateKey(startsAt, options.timeZone);
  return generateSlots({ ...options, dateKey }).some(
    (slot) => slot.getTime() === startsAt.getTime()
  );
}
