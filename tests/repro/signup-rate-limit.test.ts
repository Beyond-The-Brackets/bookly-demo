import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  createClient: () => ({
    auth: {
      signUp: async () => ({ data: { user: { id: "new-user" }, session: null }, error: null }),
    },
  }),
}));

import { POST } from "@/app/api/auth/signup/route";

const signup = (n: number) =>
  POST(
    new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.50" },
      body: JSON.stringify({
        displayName: `Bot ${n}`,
        email: `bot${n}@example.com`,
        password: "a-long-password",
      }),
    })
  );

describe("POST /api/auth/signup", () => {
  it("does not accept 50 signups from the same address in one minute", async () => {
    const statuses: number[] = [];
    for (let n = 0; n < 50; n++) statuses.push((await signup(n)).status);

    expect(statuses.filter((s) => s === 201).length).toBeLessThan(50);
    expect(statuses).toContain(429);
  });
});
