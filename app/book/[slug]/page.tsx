import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";

import { addMinutes } from "@/lib/dates";
import { createClient } from "@/lib/supabase-server";
import type { Availability, BusyInterval, Profile, Service } from "@/lib/types";

import { BookingForm } from "./BookingForm";

export const dynamic = "force-dynamic";

const BOOKING_HORIZON_DAYS = 14;

type PublicProfile = Pick<Profile, "id" | "slug" | "display_name" | "profession" | "bio" | "timezone" | "currency">;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `Book ${slug.replace(/-/g, " ")}` };
}

function Unavailable() {
  return (
    <main className="container flex min-h-screen max-w-lg flex-col items-center justify-center text-center">
      <CalendarCheck className="h-10 w-10 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-semibold">This booking page isn&apos;t available right now</h1>
      <p className="mt-2 text-muted-foreground">Please try again in a few minutes.</p>
    </main>
  );
}

export default async function PublicBookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, slug, display_name, profession, bio, timezone, currency")
    .eq("slug", slug)
    .maybeSingle<PublicProfile>();

  if (error) return <Unavailable />;
  if (!profile) notFound();

  const now = new Date();
  const horizon = addMinutes(now, (BOOKING_HORIZON_DAYS + 1) * 24 * 60);

  const [servicesResult, availabilityResult, busyResult] = await Promise.all([
    supabase
      .from("services")
      .select("id, name, description, duration_minutes, price_cents")
      .eq("profile_id", profile.id)
      .eq("active", true)
      .order("price_cents", { ascending: true }),
    supabase.from("availability").select("weekday, start_time, end_time").eq("profile_id", profile.id),
    supabase.rpc("get_busy_slots", {
      p_profile_id: profile.id,
      p_from: now.toISOString(),
      p_to: horizon.toISOString(),
    }),
  ]);

  const services = (servicesResult.data ?? []) as Pick<
    Service,
    "id" | "name" | "description" | "duration_minutes" | "price_cents"
  >[];
  const windows = (availabilityResult.data ?? []) as Pick<Availability, "weekday" | "start_time" | "end_time">[];
  const busy = (busyResult.data ?? []) as BusyInterval[];

  return (
    <main className="min-h-screen bg-muted/40 py-12">
      <div className="container max-w-3xl">
        <header className="mb-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
            {profile.display_name.charAt(0)}
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{profile.display_name}</h1>
          {profile.profession && <p className="text-muted-foreground">{profile.profession}</p>}
          {profile.bio && <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground">{profile.bio}</p>}
        </header>

        {services.length === 0 ? (
          <p className="text-center text-muted-foreground">No services are open for booking yet.</p>
        ) : (
          <BookingForm
            slug={profile.slug}
            practitionerName={profile.display_name}
            timeZone={profile.timezone}
            currency={profile.currency}
            services={services}
            windows={windows}
            busy={busy}
            nowIso={now.toISOString()}
            horizonDays={BOOKING_HORIZON_DAYS}
          />
        )}

        <p className="mt-10 text-center text-xs text-muted-foreground">Powered by Bookly</p>
      </div>
    </main>
  );
}
