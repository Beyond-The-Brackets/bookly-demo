import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CANCELLATION_POLICY } from "@/lib/billing";
import { formatDuration, formatPrice } from "@/lib/format";

export interface ConfirmedBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  serviceName: string;
  durationMinutes: number;
  priceCents: number;
}

interface Props {
  booking: ConfirmedBooking;
  practitionerName: string;
  timeZone: string;
  currency: string;
  onReset: () => void;
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

export function Confirm({ booking, practitionerName, timeZone, currency, onReset }: Props) {
  const when = formatDateParts(booking.startsAt, timeZone);

  return (
    <Card>
      <CardContent className="flex flex-col items-center px-6 py-12 text-center">
        <CheckCircle2 className="h-12 w-12 text-primary" />
        <h2 className="mt-4 text-2xl font-bold tracking-tight">You&apos;re booked!</h2>
        <p className="mt-2 text-muted-foreground">
          {booking.serviceName} with {practitionerName}
        </p>
        <dl className="mt-8 grid w-full max-w-sm gap-3 text-left text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">When</dt>
            <dd className="text-right font-medium">
              {when.day} at {when.time} {when.zone}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Duration</dt>
            <dd className="font-medium">{formatDuration(booking.durationMinutes)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Price</dt>
            <dd className="font-medium">{formatPrice(booking.priceCents, currency)}</dd>
          </div>
        </dl>
        <p className="mt-8 max-w-sm text-xs text-muted-foreground">{CANCELLATION_POLICY}</p>
        <Button variant="outline" className="mt-6" onClick={onReset}>
          Book another session
        </Button>
      </CardContent>
    </Card>
  );
}
