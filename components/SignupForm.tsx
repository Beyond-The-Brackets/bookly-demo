"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase";
import { slugify } from "@/lib/utils";
import { firstError, signupSchema } from "@/lib/validation";

const PROFESSIONS = ["Coach", "Physiotherapist", "Yoga teacher", "Personal trainer", "Other"];

export function SignupForm() {
  const router = useRouter();
  const [form, setForm] = useState({ displayName: "", profession: PROFESSIONS[0], email: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      setError(firstError(parsed.error));
      return;
    }

    setLoading(true);
    const { displayName, profession, email, password } = parsed.data;
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          profession,
          slug: slugify(displayName),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setNotice("Check your inbox to confirm your email, then log in.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your booking page</CardTitle>
        <CardDescription>Free while you get started.</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Your name or business name</Label>
            <Input id="displayName" required value={form.displayName} onChange={update("displayName")} />
            {form.displayName && (
              <p className="text-xs text-muted-foreground">Your page: /book/{slugify(form.displayName) || "…"}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="profession">What do you do?</Label>
            <select
              id="profession"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.profession}
              onChange={update("profession")}
            >
              {PROFESSIONS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={update("email")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={update("password")}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {notice && <p className="text-sm text-primary">{notice}</p>}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Create account
          </Button>
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
