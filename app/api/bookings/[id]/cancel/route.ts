import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { cancellationFee } from "@/lib/billing";
import { bookingIdSchema } from "@/lib/validation";

export async function POST(_request: Request, { params }: { params: { id: string } }) {
  if (!bookingIdSchema.safeParse(params.id).success) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const { supabase, user } = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, starts_at, status, price_paid_cents")
    .eq("id", params.id)
    .eq("profile_id", user.id)
    .maybeSingle();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  if (booking.status !== "confirmed") {
    return NextResponse.json({ error: "This booking is already closed" }, { status: 409 });
  }

  const cancelledAt = new Date();
  const fee = cancellationFee({
    priceCents: booking.price_paid_cents,
    startsAt: booking.starts_at,
    cancelledAt,
  });

  const { error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: cancelledAt.toISOString(),
      cancellation_fee_cents: fee,
    })
    .eq("id", booking.id)
    .eq("profile_id", user.id);

  if (error) {
    return NextResponse.json({ error: "Could not cancel this booking" }, { status: 500 });
  }

  return NextResponse.json({ id: booking.id, status: "cancelled", feeCents: fee });
}
