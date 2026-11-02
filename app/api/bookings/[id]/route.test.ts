import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const ALICE = "11111111-1111-4111-8111-111111111111";
const BOB = "22222222-2222-4222-8222-222222222222";
const ALICE_BOOKING = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const BOB_BOOKING = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const bookings = [
  { id: ALICE_BOOKING, profile_id: ALICE, status: "confirmed", notes: "Alice's client" },
  { id: BOB_BOOKING, profile_id: BOB, status: "confirmed", notes: "Bob's client" },
];

let signedInAs: string | null = null;

// A stand-in for the Supabase server client: it answers like the real query
// builder, applying every .eq() filter the route chains to the rows above.
function fakeSupabase() {
  return {
    auth: {
      getUser: async () => ({ data: { user: signedInAs ? { id: signedInAs } : null } }),
    },
    from: (table: string) => {
      expect(table).toBe("bookings");
      const filters: Array<[string, unknown]> = [];
      const query = {
        select: () => query,
        eq: (column: string, value: unknown) => {
          filters.push([column, value]);
          return query;
        },
        maybeSingle: async () => {
          const row = bookings.find((b) =>
            filters.every(([column, value]) => b[column as keyof typeof b] === value)
          );
          return { data: row ?? null, error: null };
        },
      };
      return query;
    },
  };
}

vi.mock("@/lib/supabase-server", () => ({ createClient: () => fakeSupabase() }));

const get = (id: string) => GET(new Request(`http://localhost/api/bookings/${id}`), { params: Promise.resolve({ id }) });

describe("GET /api/bookings/[id]", () => {
  beforeEach(() => {
    signedInAs = null;
  });

  it("returns 401 when nobody is signed in", async () => {
    const res = await get(ALICE_BOOKING);
    expect(res.status).toBe(401);
  });

  it("returns the practitioner's own booking", async () => {
    signedInAs = ALICE;
    const res = await get(ALICE_BOOKING);
    expect(res.status).toBe(200);
    expect((await res.json()).booking.id).toBe(ALICE_BOOKING);
  });

  it("returns 404 for another practitioner's booking", async () => {
    signedInAs = ALICE;
    const res = await get(BOB_BOOKING);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "Booking not found" });
  });
});
