"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ClaimForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    token ? null : "That set-password link is missing its token.",
  );
  const [pending, setPending] = useState(false);

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Paid seat
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Set your password
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        This opens the login for the email you paid with.
      </p>
      {error ? (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <form
        className="mt-8 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!token) return;
          setPending(true);
          setError(null);
          try {
            const res = await fetch("/api/checkout/claim", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, name, password }),
            });
            const data = (await res.json()) as {
              error?: string;
              member?: { email?: string };
            };
            if (!res.ok) {
              setError(data.error || "Could not set that password.");
              return;
            }
            const email = data.member?.email;
            if (email) {
              const signed = await signIn("credentials", {
                email,
                password,
                redirect: false,
              });
              if (!signed?.error) {
                router.push("/dashboard");
                return;
              }
            }
            router.push("/login");
          } catch {
            setError("Could not reach the campus. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="claim-name">Name</Label>
          <Input
            id="claim-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Your name"
            required
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="claim-password">Password</Label>
          <Input
            id="claim-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            className="h-11 rounded-xl"
          />
        </div>
        <Button className="h-12 w-full rounded-xl" type="submit" disabled={pending || !token}>
          {pending ? "Saving…" : "Set password and enter"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-muted-foreground">
        Already set a password?{" "}
        <Link href="/login" className="underline underline-offset-2">
          Sign in
        </Link>
        .
      </p>
    </main>
  );
}
