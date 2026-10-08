import type { Metadata } from "next";
import { Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireProfile } from "@/lib/auth";
import { formatInTimeZone } from "@/lib/format";
import type { Client } from "@/lib/types";

export const metadata: Metadata = { title: "Clients" };

type ClientRow = Pick<Client, "id" | "name" | "email" | "phone" | "created_at"> & {
  bookings: { count: number }[];
};

export default async function ClientsPage() {
  const { supabase, profile } = await requireProfile();

  const { data } = await supabase
    .from("clients")
    .select("id, name, email, phone, created_at, bookings(count)")
    .eq("profile_id", profile.id)
    .order("name", { ascending: true })
    .returns<ClientRow[]>();

  const clients = (data ?? []).map((c) => ({ ...c, bookingCount: c.bookings[0]?.count ?? 0 }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">Everyone who has booked with you.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {clients.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Users className="h-8 w-8 text-muted-foreground" />
              <p className="mt-4 font-medium">No clients yet</p>
              <p className="mt-1 text-sm text-muted-foreground">They appear here after their first booking.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Bookings</TableHead>
                  <TableHead className="text-right">Client since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>{client.email}</TableCell>
                    <TableCell>{client.phone ?? "—"}</TableCell>
                    <TableCell className="text-right">{client.bookingCount}</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatInTimeZone(client.created_at, profile.timezone, { month: "short", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
