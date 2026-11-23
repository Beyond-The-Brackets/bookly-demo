import { NextResponse } from "next/server";
import { z } from "zod";

import { clientIp, createRateLimiter } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase-server";
import { slugify } from "@/lib/utils";
import { firstError, signupSchema } from "@/lib/validation";

const signupRequestSchema = signupSchema.extend({
  timezone: z.string().max(64).optional(),
});

// Signup is the one /api route that cannot check a session: the caller has no
// account yet. A per-address cap is what stops a script from creating accounts
// in a loop. Checked before the body is read, so refused calls cost nothing.
const rateLimit = createRateLimiter({ limit: 5, windowMs: 10 * 60_000 });

export async function POST(request: Request) {
  const limited = rateLimit(clientIp(request));
  if (!limited.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(limited.retryAfterSeconds) } }
    );
  }

  const parsed = signupRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  const { displayName, profession, email, password, timezone } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        profession,
        slug: slugify(displayName),
        timezone: timezone ?? "UTC",
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ signedIn: Boolean(data.session) }, { status: 201 });
}
