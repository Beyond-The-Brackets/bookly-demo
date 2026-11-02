import { describe, expect, it, vi } from "vitest";

import { POST } from "./route";

vi.mock("@/lib/supabase-server", () => ({
  createClient: () => {
    throw new Error("the database should not be reached in these tests");
  },
}));

const post = (ip: string) =>
  POST(
    new Request("http://localhost/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: "{}",
    })
  );

describe("POST /api/bookings", () => {
  it("refuses an address that keeps posting", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 11; i++) statuses.push((await post("198.51.100.1")).status);

    expect(statuses.slice(0, 10).every((s) => s === 400)).toBe(true);
    expect(statuses[10]).toBe(429);
  });

  it("does not hold one address's attempts against another", async () => {
    expect((await post("198.51.100.2")).status).toBe(400);
  });
});
