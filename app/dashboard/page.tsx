import type { Metadata } from "next";

import { UpcomingList } from "@/components/UpcomingList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireProfile } from "@/lib/auth";
import { addMinutes } from "@/lib/dates";
import { formatPrice } from "@/lib/format";
import type { BookingWithRelations } from "@/lib/types";

export const metadata: Metadata = { title: "Upcoming" };

const WEEK_MINUTES = 7 * 24 * 60;

export default async function DashboardPage() {
  const { supabase, profile } = await requireProfile();
  const now = new Date();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, ends_at, status, price_paid_cents, notes, service:services(name, duration_minutes), client:clients(name, email, phone)"
    )
    .eq("profile_id", profile.id)
    .eq("status", "confirmed")
    .gte("starts_at", now.toISOString())
    .order("starts_at", { ascending: true })
    .limit(100)
    .returns<BookingWithRelations[]>();

  const bookings = data ?? [];
  const weekEnd = addMinutes(now, WEEK_MINUTES);
  const thisWeek = bookings.filter((b) => new Date(b.starts_at) < weekEnd);
  const expected = thisWeek.reduce((sum, b) => sum + b.price_paid_cents, 0);

  const stats = [
    { label: "Upcoming", value: String(bookings.length) },
    { label: "Next 7 days", value: String(thisWeek.length) },
    { label: "Expected this week", value: formatPrice(expected, profile.currency) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hi {profile.display_name.split(" ")[0]} 👋</h1>
        <p className="text-muted-foreground">Here is what is coming up.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error ? (
        <p className="text-sm text-destructive">We could not load your bookings. Please refresh the page.</p>
      ) : (
        <UpcomingList bookings={bookings} timeZone={profile.timezone} currency={profile.currency} />
      )}
    </div>
  );
}
