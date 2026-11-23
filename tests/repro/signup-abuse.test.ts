import { beforeEach, describe, expect, it, vi } from "vitest";

const { signUps } = vi.hoisted(() => ({ signUps: [] as string[] }));

vi.mock("@/lib/supabase-server", () => ({
  createClient: async () => ({
    auth: {
      signUp: async ({ email }: { email: string }) => {
        signUps.push(email);
        return { data: { session: null }, error: null };
      },
    },
  }),
}));

import { POST } from "@/app/api/auth/signup/route";

function signup(i: number, ip = "203.0.113.50") {
  return POST(
    new Request("http://localhost/api/auth/signup", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({
        displayName: `Bot Account ${i}`,
        profession: "Coach",
        email: `bot${i}@example.com`,
        password: "a-long-enough-password-123",
      }),
    })
  );
}

describe("POST /api/auth/signup", () => {
  beforeEach(() => {
    signUps.length = 0;
  });

  it("stops a script from creating accounts in a loop from one address", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 50; i++) statuses.push((await signup(i)).status);

    expect(statuses).toContain(429);
    expect(signUps.length).toBeLessThanOrEqual(5);
  });

  it("still lets a different address sign up", async () => {
    const res = await signup(999, "198.51.100.77");
    expect(res.status).toBe(201);
    expect(signUps).toEqual(["bot999@example.com"]);
  });
});
