import { NextResponse } from "next/server";

import { addMinutes } from "@/lib/dates";
import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { isSlotAvailable } from "@/lib/slots";
import { createClient } from "@/lib/supabase-server";
import type { Availability, BusyInterval } from "@/lib/types";
import { bookingRequestSchema, firstError } from "@/lib/validation";

// The booking page is public: cap how fast one address can fill a calendar.
const rateLimit = createRateLimiter({ limit: 10, windowMs: 60_000 });

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: Request) {
  const limited = rateLimit(clientIp(request));
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please wait a minute and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = bookingRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return error(firstError(parsed.error), 400);

  const { slug, serviceId, startsAt, name, email, phone, notes } = parsed.data;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, timezone")
    .eq("slug", slug)
    .maybeSingle();
  if (!profile) return error("This booking page does not exist.", 404);

  const { data: service } = await supabase
    .from("services")
    .select("id, name, duration_minutes, price_cents")
    .eq("id", serviceId)
    .eq("profile_id", profile.id)
    .eq("active", true)
    .maybeSingle();
  if (!service) return error("This service is no longer available.", 404);

  const start = new Date(startsAt);
  const end = addMinutes(start, service.duration_minutes);

  const [{ data: windows }, { data: busy }] = await Promise.all([
    supabase.from("availability").select("weekday, start_time, end_time").eq("profile_id", profile.id),
    supabase.rpc("get_busy_slots", {
      p_profile_id: profile.id,
      p_from: addMinutes(start, -24 * 60).toISOString(),
      p_to: addMinutes(end, 24 * 60).toISOString(),
    }),
  ]);

  const available = isSlotAvailable(start, {
    timeZone: profile.timezone,
    durationMinutes: service.duration_minutes,
    windows: (windows ?? []) as Pick<Availability, "weekday" | "start_time" | "end_time">[],
    busy: (busy ?? []) as BusyInterval[],
  });
  if (!available) return error("This time is no longer available. Please pick another one.", 409);

  const { data: bookingId, error: bookingError } = await supabase.rpc("create_booking", {
    p_profile_id: profile.id,
    p_service_id: service.id,
    p_starts_at: start.toISOString(),
    p_client_name: name,
    p_client_email: email,
    p_client_phone: phone ?? null,
    p_notes: notes || null,
  });

  if (bookingError) {
    if (bookingError.code === "23505" || bookingError.message.includes("slot_taken")) {
      return error("This time is no longer available. Please pick another one.", 409);
    }
    console.error("create_booking failed", bookingError.message);
    return error("We could not save your booking. Please try again.", 500);
  }

  return NextResponse.json(
    {
      booking: {
        id: bookingId,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        serviceName: service.name,
        durationMinutes: service.duration_minutes,
        priceCents: service.price_cents,
      },
    },
    { status: 201 }
  );
}
