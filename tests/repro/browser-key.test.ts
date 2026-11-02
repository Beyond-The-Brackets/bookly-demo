import { describe, expect, it, vi } from "vitest";

const { keys } = vi.hoisted(() => ({ keys: [] as string[] }));

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: (_url: string, key: string) => {
    keys.push(key);
    return {};
  },
}));

import { createClient } from "@/lib/supabase";

function jwtRole(token: string) {
  const payload = token.split(".")[1];
  if (!payload) return null;
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role ?? null;
}

describe("lib/supabase (shipped to the browser)", () => {
  it("never gives the browser the service role key", () => {
    createClient();
    expect(keys).toHaveLength(1);
    expect(jwtRole(keys[0])).not.toBe("service_role");
  });
});
