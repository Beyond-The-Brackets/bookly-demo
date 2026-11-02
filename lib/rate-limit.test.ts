import { describe, expect, it } from "vitest";

import { clientIp, createRateLimiter } from "./rate-limit";

describe("createRateLimiter", () => {
  it("lets requests through up to the limit, then refuses", () => {
    const check = createRateLimiter({ limit: 3, windowMs: 60_000 });
    const now = 1_000_000;
    expect([1, 2, 3].map(() => check("ip", now).ok)).toEqual([true, true, true]);
    expect(check("ip", now)).toEqual({ ok: false, retryAfterSeconds: 60 });
  });

  it("counts each key on its own", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(check("a").ok).toBe(true);
    expect(check("b").ok).toBe(true);
    expect(check("a").ok).toBe(false);
  });

  it("starts a new window once the old one is over", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 60_000 });
    expect(check("ip", 0).ok).toBe(true);
    expect(check("ip", 30_000).ok).toBe(false);
    expect(check("ip", 60_000).ok).toBe(true);
  });
});

describe("clientIp", () => {
  it("takes the first address of x-forwarded-for", () => {
    const request = new Request("http://localhost", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } });
    expect(clientIp(request)).toBe("203.0.113.7");
  });
});
