import { NextResponse } from "next/server";
import { z } from "zod";

import { createClient } from "@/lib/supabase-server";
import { slugify } from "@/lib/utils";
import { firstError, signupSchema } from "@/lib/validation";

const signupRequestSchema = signupSchema.extend({
  timezone: z.string().max(64).optional(),
});

export async function POST(request: Request) {
  const parsed = signupRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  }

  const { displayName, profession, email, password, timezone } = parsed.data;
  const supabase = createClient();
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
