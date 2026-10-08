import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";

import { DashboardNav } from "@/components/DashboardNav";
import { Logo } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { requireProfile } from "@/lib/auth";

import { signOut } from "./actions";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireProfile();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background">
        <div className="container flex h-16 items-center justify-between">
          <Logo />
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/book/${profile.slug}`} target="_blank">
                My booking page
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </Button>
            <span className="hidden text-sm text-muted-foreground sm:inline">{profile.display_name}</span>
            <form action={signOut}>
              <Button variant="ghost" size="icon" type="submit" aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="container grid gap-8 py-8 md:grid-cols-[200px_1fr]">
        <aside>
          <DashboardNav />
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}
