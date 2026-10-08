import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="container flex min-h-screen max-w-lg flex-col items-center justify-center text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">We couldn&apos;t find that page</h1>
      <p className="mt-2 text-muted-foreground">The link may be wrong or the booking page was removed.</p>
      <Button className="mt-6" asChild>
        <Link href="/">Back to Bookly</Link>
      </Button>
    </main>
  );
}
