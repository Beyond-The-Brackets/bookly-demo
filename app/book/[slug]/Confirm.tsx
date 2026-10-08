import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CANCELLATION_POLICY } from "@/lib/billing";
import { formatBookingDateTime, formatDuration, formatPrice } from "@/lib/format";

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

export function Confirm({ booking, practitionerName, timeZone, currency, onReset }: Props) {
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
            <dd className="text-right font-medium">{formatBookingDateTime(booking.startsAt, timeZone)}</dd>
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
