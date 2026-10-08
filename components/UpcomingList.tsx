import { CalendarX } from "lucide-react";

import { BookingCard } from "@/components/BookingCard";
import { toDateKey } from "@/lib/dates";
import { formatBookingDate } from "@/lib/format";
import type { BookingWithRelations } from "@/lib/types";

interface Props {
  bookings: BookingWithRelations[];
  timeZone: string;
  currency: string;
}

export function UpcomingList({ bookings, timeZone, currency }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed bg-background py-16 text-center">
        <CalendarX className="h-8 w-8 text-muted-foreground" />
        <p className="mt-4 font-medium">No upcoming bookings</p>
        <p className="mt-1 text-sm text-muted-foreground">Share your booking page to get your first one.</p>
      </div>
    );
  }

  const groups = new Map<string, BookingWithRelations[]>();
  for (const booking of bookings) {
    const key = toDateKey(new Date(booking.starts_at), timeZone);
    groups.set(key, [...(groups.get(key) ?? []), booking]);
  }

  return (
    <div className="space-y-8">
      {Array.from(groups.entries()).map(([day, items]) => (
        <section key={day}>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {formatBookingDate(items[0].starts_at, timeZone)}
          </h2>
          <div className="space-y-3">
            {items.map((booking) => (
              <BookingCard key={booking.id} booking={booking} timeZone={timeZone} currency={currency} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
