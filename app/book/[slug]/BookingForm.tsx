"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { upcomingDateKeys, zonedTimeToUtc } from "@/lib/dates";
import { formatBookingTime, formatDuration, formatInTimeZone, formatPrice } from "@/lib/format";
import { generateSlots, type AvailabilityWindow } from "@/lib/slots";
import type { BusyInterval, Service } from "@/lib/types";
import { cn } from "@/lib/utils";

import { Confirm, type ConfirmedBooking } from "./Confirm";

interface Props {
  slug: string;
  practitionerName: string;
  timeZone: string;
  currency: string;
  services: Pick<Service, "id" | "name" | "description" | "duration_minutes" | "price_cents">[];
  windows: AvailabilityWindow[];
  busy: BusyInterval[];
  nowIso: string;
  horizonDays: number;
}

export function BookingForm(props: Props) {
  const { slug, practitionerName, timeZone, currency, services, windows, horizonDays } = props;
  const now = useMemo(() => new Date(props.nowIso), [props.nowIso]);

  const [busy, setBusy] = useState(props.busy);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [dateKey, setDateKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [details, setDetails] = useState({ name: "", email: "", phone: "", notes: "" });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  const service = services.find((s) => s.id === serviceId);

  const days = useMemo(() => {
    if (!service) return [];
    return upcomingDateKeys(now, timeZone, horizonDays).map((key) => ({
      key,
      slots: generateSlots({
        dateKey: key,
        timeZone,
        durationMinutes: service.duration_minutes,
        windows,
        busy,
        now,
      }),
    }));
  }, [service, now, timeZone, horizonDays, windows, busy]);

  const selectedDay = days.find((d) => d.key === dateKey) ?? days.find((d) => d.slots.length > 0);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!service || !slot) return;
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, serviceId: service.id, startsAt: slot, ...details }),
    });
    const body = await res.json().catch(() => ({}));
    setSubmitting(false);

    if (!res.ok) {
      setError(body.error ?? "Something went wrong. Please try again.");
      if (res.status === 409) {
        setBusy((b) => [...b, { starts_at: slot, ends_at: slot }]);
        setSlot(null);
      }
      return;
    }
    setConfirmed(body.booking);
  }

  if (confirmed) {
    return (
      <Confirm
        booking={confirmed}
        practitionerName={practitionerName}
        timeZone={timeZone}
        currency={currency}
        onReset={() => {
          setConfirmed(null);
          setSlot(null);
          setBusy((b) => [...b, { starts_at: confirmed.startsAt, ends_at: confirmed.endsAt }]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Choose a service</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setServiceId(s.id);
                setSlot(null);
              }}
              className={cn(
                "rounded-lg border p-4 text-left transition-colors",
                s.id === serviceId ? "border-primary bg-accent" : "hover:bg-muted"
              )}
            >
              <p className="font-medium">{s.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDuration(s.duration_minutes)} · {formatPrice(s.price_cents, currency)}
              </p>
              {s.description && <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Pick a time</CardTitle>
          <p className="text-sm text-muted-foreground">Times are shown in {timeZone.replace(/_/g, " ")}.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {days.map((day) => (
              <button
                key={day.key}
                type="button"
                disabled={day.slots.length === 0}
                onClick={() => {
                  setDateKey(day.key);
                  setSlot(null);
                }}
                className={cn(
                  "min-w-[72px] rounded-lg border px-3 py-2 text-center text-sm transition-colors disabled:opacity-40",
                  selectedDay?.key === day.key ? "border-primary bg-accent" : "hover:bg-muted"
                )}
              >
                {formatInTimeZone(zonedTimeToUtc(day.key, "12:00", timeZone), timeZone, {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })}
              </button>
            ))}
          </div>
          {selectedDay && selectedDay.slots.length > 0 ? (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {selectedDay.slots.map((s) => {
                const iso = s.toISOString();
                return (
                  <Button
                    key={iso}
                    type="button"
                    variant={slot === iso ? "default" : "outline"}
                    onClick={() => setSlot(iso)}
                  >
                    {formatBookingTime(s, timeZone)}
                  </Button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No free slots in the next {horizonDays} days.</p>
          )}
        </CardContent>
      </Card>

      {slot && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Your details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="notes">Anything to share before the session?</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={details.notes}
                  onChange={(e) => setDetails({ ...details, notes: e.target.value })}
                />
              </div>
              {error && <p className="text-sm text-destructive sm:col-span-2">{error}</p>}
              <div className="sm:col-span-2">
                <Button type="submit" size="lg" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm booking
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {!slot && error && <p className="text-center text-sm text-destructive">{error}</p>}
    </div>
  );
}
