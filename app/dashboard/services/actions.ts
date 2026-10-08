"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireProfile } from "@/lib/auth";
import { firstError, serviceSchema } from "@/lib/validation";

const PATH = "/dashboard/services";

function fail(message: string): never {
  redirect(`${PATH}?error=${encodeURIComponent(message)}`);
}

export async function createService(formData: FormData) {
  const { supabase, profile } = await requireProfile();

  const parsed = serviceSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    durationMinutes: formData.get("durationMinutes"),
    price: formData.get("price"),
  });
  if (!parsed.success) fail(firstError(parsed.error));

  const { name, description, durationMinutes, price } = parsed.data;
  const { error } = await supabase.from("services").insert({
    profile_id: profile.id,
    name,
    description: description ?? null,
    duration_minutes: durationMinutes,
    price_cents: Math.round(price * 100),
  });
  if (error) fail("Could not save this service.");

  revalidatePath(PATH);
  redirect(PATH);
}

export async function toggleService(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const id = String(formData.get("id"));
  const active = formData.get("active") === "true";

  const { error } = await supabase
    .from("services")
    .update({ active: !active })
    .eq("id", id)
    .eq("profile_id", profile.id);
  if (error) fail("Could not update this service.");

  revalidatePath(PATH);
}

export async function deleteService(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const id = String(formData.get("id"));

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", id)
    .eq("profile_id", profile.id);
  if (error) fail("This service has bookings. Hide it instead of deleting it.");

  revalidatePath(PATH);
}
