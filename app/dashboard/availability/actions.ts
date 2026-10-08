"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { availabilitySchema, firstError } from "@/lib/validation";

const PATH = "/dashboard/availability";

function fail(message: string): never {
  redirect(`${PATH}?error=${encodeURIComponent(message)}`);
}

export async function addAvailability(formData: FormData) {
  const { supabase, profile } = await requireProfile();

  const parsed = availabilitySchema.safeParse({
    weekday: formData.get("weekday"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });
  if (!parsed.success) fail(firstError(parsed.error));

  const { weekday, startTime, endTime } = parsed.data;
  const { error } = await supabase.from("availability").insert({
    profile_id: profile.id,
    weekday,
    start_time: startTime,
    end_time: endTime,
  });
  if (error) fail("Could not save these hours.");

  revalidatePath(PATH);
  redirect(PATH);
}

export async function removeAvailability(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", id)
    .eq("profile_id", profile.id);
  if (error) fail("Could not remove these hours.");

  revalidatePath(PATH);
}
