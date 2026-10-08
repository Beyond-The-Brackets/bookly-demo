"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cancellationFee } from "@/lib/billing";
import { formatPrice } from "@/lib/format";

interface Props {
  bookingId: string;
  startsAt: string;
  priceCents: number;
  currency: string;
}

export function CancelBookingButton({ bookingId, startsAt, priceCents, currency }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onCancel() {
    const fee = cancellationFee({ priceCents, startsAt });
    const message =
      fee > 0
        ? `Cancel this booking? The client will be charged a ${formatPrice(fee, currency)} late cancellation fee.`
        : "Cancel this booking? No fee applies.";
    if (!window.confirm(message)) return;

    setLoading(true);
    const res = await fetch(`/api/bookings/${bookingId}/cancel`, { method: "POST" });
    setLoading(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      window.alert(body.error ?? "Could not cancel this booking.");
      return;
    }
    router.refresh();
  }

  return (
    <Button variant="ghost" size="sm" onClick={onCancel} disabled={loading}>
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
      Cancel
    </Button>
  );
}
