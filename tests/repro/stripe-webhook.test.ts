import Stripe from "stripe";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { WEBHOOK_SECRET, updates } = vi.hoisted(() => {
  // A made-up secret for this test only.
  const WEBHOOK_SECRET = "whsec_bookly_demo_not_a_real_secret";
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  return { WEBHOOK_SECRET, updates: [] as Array<{ values: Record<string, unknown>; id: unknown }> };
});

vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      update: (values: Record<string, unknown>) => ({
        eq: async (_column: string, id: unknown) => {
          updates.push({ values, id });
          return { error: null };
        },
      }),
    }),
  }),
}));

import { POST } from "@/app/api/stripe/route";

const BOOKING_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const paymentSucceeded = JSON.stringify({
  id: "evt_demo",
  object: "event",
  type: "checkout.session.completed",
  data: { object: { object: "checkout.session", amount_total: 9000, metadata: { booking_id: BOOKING_ID } } },
});

function send(payload: string, signature?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (signature) headers["stripe-signature"] = signature;
  return POST(new Request("http://localhost/api/stripe", { method: "POST", headers, body: payload }));
}

describe("POST /api/stripe", () => {
  beforeEach(() => {
    updates.length = 0;
  });

  it("refuses a forged \"payment succeeded\" event with no signature", async () => {
    const res = await send(paymentSucceeded);
    expect(res.status).toBe(400);
    expect(updates).toEqual([]);
  });

  it("refuses an event signed with the wrong secret", async () => {
    const signature = new Stripe("sk_test_unused").webhooks.generateTestHeaderString({
      payload: paymentSucceeded,
      secret: "whsec_someone_else",
    });
    const res = await send(paymentSucceeded, signature);
    expect(res.status).toBe(400);
    expect(updates).toEqual([]);
  });

  it("records the payment of an event Stripe really signed", async () => {
    const signature = new Stripe("sk_test_unused").webhooks.generateTestHeaderString({
      payload: paymentSucceeded,
      secret: WEBHOOK_SECRET,
    });
    const res = await send(paymentSucceeded, signature);
    expect(res.status).toBe(200);
    expect(updates).toHaveLength(1);
    expect(updates[0].id).toBe(BOOKING_ID);
    expect(updates[0].values.price_paid_cents).toBe(9000);
  });
});
