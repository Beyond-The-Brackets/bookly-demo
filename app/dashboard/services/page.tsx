import type { Metadata } from "next";
import { Eye, EyeOff, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { requireProfile } from "@/lib/auth";
import { formatDuration, formatPrice } from "@/lib/format";
import type { Service } from "@/lib/types";

import { createService, deleteService, toggleService } from "./actions";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const { supabase, profile } = await requireProfile();

  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: true })
    .returns<Service[]>();
  const services = data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Services</h1>
        <p className="text-muted-foreground">What clients can book, how long it takes and what it costs.</p>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</p>
      )}

      <Card>
        <CardContent className="p-0">
          {services.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No services yet. Add your first one below.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      )}
                    </TableCell>
                    <TableCell>{formatDuration(service.duration_minutes)}</TableCell>
                    <TableCell>{formatPrice(service.price_cents, profile.currency)}</TableCell>
                    <TableCell>
                      <Badge variant={service.active ? "default" : "outline"}>
                        {service.active ? "Bookable" : "Hidden"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <form action={toggleService}>
                          <input type="hidden" name="id" value={service.id} />
                          <input type="hidden" name="active" value={String(service.active)} />
                          <Button variant="ghost" size="icon" aria-label={service.active ? "Hide" : "Show"}>
                            {service.active ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </form>
                        <form action={deleteService}>
                          <input type="hidden" name="id" value={service.id} />
                          <Button variant="ghost" size="icon" aria-label="Delete">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </form>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add a service</CardTitle>
          <CardDescription>It appears on your booking page right away.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createService} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" name="name" placeholder="Discovery session" required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" placeholder="Optional" rows={2} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input id="durationMinutes" name="durationMinutes" type="number" min={10} max={480} step={5} defaultValue={60} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ({profile.currency})</Label>
              <Input id="price" name="price" type="number" min={0} step="0.01" defaultValue={50} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Add service</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
