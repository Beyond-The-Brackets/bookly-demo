import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase-server";
import type { Profile } from "@/lib/types";

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function requireProfile() {
  const { supabase, user } = await getCurrentUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single<Profile>();

  if (!profile) redirect("/login?error=profile");

  return { supabase, user, profile };
}
