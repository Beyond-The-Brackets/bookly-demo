import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { createAdminClient } from "@/lib/supabase-admin";

// Stripe calls this once a client has paid for a booking online.
export async function POST(request: Request) {
  const payload = await request.text();

  let event: Stripe.Event;
  try {
    event = JSON.parse(payload) as Stripe.Event;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookingId = session.metadata?.booking_id;

    if (bookingId) {
      const supabase = createAdminClient();
      const { error } = await supabase
        .from("bookings")
        .update({ paid_at: new Date().toISOString(), price_paid_cents: session.amount_total ?? 0 })
        .eq("id", bookingId);

      if (error) {
        console.error("Could not mark booking as paid", error.message);
        return NextResponse.json({ error: "Could not record the payment" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
