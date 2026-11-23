import { beforeEach, describe, expect, it, vi } from "vitest";

const signUp = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  createClient: async () => ({ auth: { signUp } }),
}));

import { POST } from "./route";

let n = 0;
const post = (ip: string) =>
  POST(
    new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({
        displayName: `Script Account ${++n}`,
        profession: "Therapist",
        email: `bot${n}@example.com`,
        password: "correct-horse-battery-staple",
      }),
    })
  );

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    signUp.mockReset();
    signUp.mockResolvedValue({ data: { session: null }, error: null });
  });

  it("stops one address from creating accounts in a loop", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 50; i++) statuses.push((await post("198.51.100.10")).status);

    expect(statuses.slice(0, 5).every((s) => s === 201)).toBe(true);
    expect(statuses.slice(5).every((s) => s === 429)).toBe(true);
    expect(signUp).toHaveBeenCalledTimes(5);
  });

  it("tells a refused caller when to retry", async () => {
    for (let i = 0; i < 5; i++) await post("198.51.100.11");
    const refused = await post("198.51.100.11");

    expect(refused.status).toBe(429);
    expect(Number(refused.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("does not hold one address's signups against another", async () => {
    for (let i = 0; i < 5; i++) await post("198.51.100.12");
    expect((await post("198.51.100.13")).status).toBe(201);
  });
});
