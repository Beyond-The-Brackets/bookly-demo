import type { Metadata } from "next";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireProfile } from "@/lib/auth";
import { WEEKDAYS, type Availability } from "@/lib/types";

import { addAvailability, removeAvailability } from "./actions";

export const metadata: Metadata = { title: "Availability" };

const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function hhmm(time: string) {
  return time.slice(0, 5);
}

export default async function AvailabilityPage({ searchParams }: { searchParams: { error?: string } }) {
  const { supabase, profile } = await requireProfile();

  const { data } = await supabase
    .from("availability")
    .select("id, profile_id, weekday, start_time, end_time")
    .eq("profile_id", profile.id)
    .order("start_time", { ascending: true })
    .returns<Availability[]>();
  const windows = data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Availability</h1>
        <p className="text-muted-foreground">
          Your weekly hours, in your time zone ({profile.timezone}). Clients only see free slots inside them.
        </p>
      </div>

      {searchParams.error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{searchParams.error}</p>
      )}

      <Card>
        <CardContent className="divide-y p-0">
          {DISPLAY_ORDER.map((weekday) => {
            const day = windows.filter((w) => w.weekday === weekday);
            return (
              <div key={weekday} className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center">
                <span className="w-32 font-medium">{WEEKDAYS[weekday]}</span>
                <div className="flex flex-wrap gap-2">
                  {day.length === 0 && <span className="text-sm text-muted-foreground">Unavailable</span>}
                  {day.map((w) => (
                    <form key={w.id} action={removeAvailability}>
                      <input type="hidden" name="id" value={w.id} />
                      <span className="inline-flex items-center gap-1 rounded-full bg-accent py-1 pl-3 pr-1 text-sm text-accent-foreground">
                        {hhmm(w.start_time)} – {hhmm(w.end_time)}
                        <button
                          type="submit"
                          className="rounded-full p-0.5 hover:bg-background"
                          aria-label={`Remove ${WEEKDAYS[weekday]} ${hhmm(w.start_time)}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </form>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add hours</CardTitle>
          <CardDescription>Add several ranges to the same day for a lunch break.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={addAvailability} className="grid gap-4 sm:grid-cols-4 sm:items-end">
            <div className="space-y-2">
              <Label htmlFor="weekday">Day</Label>
              <select
                id="weekday"
                name="weekday"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={1}
              >
                {DISPLAY_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {WEEKDAYS[d]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">From</Label>
              <Input id="startTime" name="startTime" type="time" defaultValue="09:00" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">To</Label>
              <Input id="endTime" name="endTime" type="time" defaultValue="17:00" required />
            </div>
            <Button type="submit">Add</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
