import { Mail, Phone } from "lucide-react";

import { CancelBookingButton } from "@/components/CancelBookingButton";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatPrice } from "@/lib/format";
import type { BookingWithRelations } from "@/lib/types";

interface Props {
  booking: BookingWithRelations;
  timeZone: string;
  currency: string;
}

function formatDateParts(value: string | Date, timeZone: string) {
  const date = typeof value === "string" ? new Date(value) : value;
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);
  const zone =
    new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
      .formatToParts(date)
      .find((part) => part.type === "timeZoneName")?.value ?? timeZone;
  return { day, time, zone };
}

export function BookingCard({ booking, timeZone, currency }: Props) {
  const start = formatDateParts(booking.starts_at, timeZone);
  const end = formatDateParts(booking.ends_at, timeZone);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-primary">
          {start.time} – {end.time} {start.zone}
        </p>
        <p className="font-semibold">{booking.client?.name ?? "Unknown client"}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {booking.client?.email && (
            <span className="flex items-center gap-1">
              <Mail className="h-3.5 w-3.5" />
              {booking.client.email}
            </span>
          )}
          {booking.client?.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3.5 w-3.5" />
              {booking.client.phone}
            </span>
          )}
        </div>
        {booking.notes && <p className="text-sm italic text-muted-foreground">“{booking.notes}”</p>}
      </div>
      <div className="flex items-center gap-3">
        {booking.service && (
          <Badge variant="secondary">
            {booking.service.name} · {formatDuration(booking.service.duration_minutes)}
          </Badge>
        )}
        <span className="text-sm font-medium">{formatPrice(booking.price_paid_cents, currency)}</span>
        <CancelBookingButton
          bookingId={booking.id}
          startsAt={booking.starts_at}
          priceCents={booking.price_paid_cents}
          currency={currency}
        />
      </div>
    </div>
  );
}
