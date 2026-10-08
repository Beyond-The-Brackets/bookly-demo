import Link from "next/link";
import { BellRing, CalendarClock, Link2, ShieldCheck, Users, Wallet } from "lucide-react";

import { SiteHeader } from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Link2,
    title: "Your own booking page",
    body: "Share one link. Clients pick a service and a free slot, no account needed.",
  },
  {
    icon: CalendarClock,
    title: "Availability that stays true",
    body: "Set your weekly hours once. Bookly never offers a slot you already gave away.",
  },
  {
    icon: Wallet,
    title: "Fair cancellation fees",
    body: "Free up to 24 hours before, then a clear fee. No awkward conversations.",
  },
  {
    icon: Users,
    title: "Client list built for you",
    body: "Every client and every visit in one place, ready when they come back.",
  },
  {
    icon: BellRing,
    title: "Your day at a glance",
    body: "See what is coming up today and this week the moment you log in.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    body: "Your clients' details are only visible to you.",
  },
];

const steps = [
  { title: "Create your account", body: "Takes a minute. Your booking page is ready right away." },
  { title: "Add services and hours", body: "A 60-minute session, a 30-minute check-in, your weekly slots." },
  { title: "Share your link", body: "Put it in your bio, your emails, your website." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="container py-20 text-center md:py-28">
          <p className="mb-4 inline-block rounded-full bg-accent px-3 py-1 text-sm font-medium text-accent-foreground">
            For coaches, physios and yoga teachers
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
            Let clients book you while you work.
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Bookly gives you a booking page, a calendar of your appointments and a client list. No setup call, no
            monthly contract.
          </p>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" asChild>
              <Link href="/signup">Create my booking page</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/book/demo-coach">See a live example</Link>
            </Button>
          </div>
        </section>

        <section className="border-y bg-muted/40 py-20">
          <div className="container">
            <h2 className="text-center text-3xl font-bold tracking-tight">Everything a solo practice needs</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, body }) => (
                <Card key={title}>
                  <CardHeader>
                    <Icon className="h-6 w-6 text-primary" />
                    <CardTitle className="pt-2">{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-muted-foreground">{body}</CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight">Up and running in three steps</h2>
          <ol className="mx-auto mt-12 grid max-w-4xl gap-8 md:grid-cols-3">
            {steps.map((step, i) => (
              <li key={step.title} className="text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="container pb-24">
          <div className="rounded-2xl bg-primary px-8 py-14 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold tracking-tight">Your next client is looking for a free slot.</h2>
            <Button size="lg" variant="secondary" className="mt-8" asChild>
              <Link href="/signup">Get started for free</Link>
            </Button>
          </div>
        </section>
      </main>
      <footer className="border-t py-8">
        <div className="container flex flex-col items-center justify-between gap-2 text-sm text-muted-foreground sm:flex-row">
          <span>© {new Date().getFullYear()} Bookly</span>
          <span>Made for independents.</span>
        </div>
      </footer>
    </>
  );
}
