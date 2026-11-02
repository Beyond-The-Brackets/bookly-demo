import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { bookingIdSchema } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!bookingIdSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const { supabase, user } = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      "id, starts_at, ends_at, status, price_paid_cents, cancellation_fee_cents, cancelled_at, notes, created_at, service:services(id, name, duration_minutes), client:clients(id, name, email, phone)"
    )
    .eq("id", id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: "Could not load this booking" }, { status: 500 });
  }
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ booking });
}
