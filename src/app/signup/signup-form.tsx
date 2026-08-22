"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { OAuthSignInButtons } from "@/components/oauth-sign-in-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { OAuthProviderStatus } from "@/lib/auth/env";
import { authErrorMessage } from "@/lib/members/policy";
import { continueAsGuest } from "@/lib/portal";

type Props = {
  oauth: OAuthProviderStatus;
};

export function SignupForm({ oauth }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("error")
      ? authErrorMessage(searchParams.get("error"))
      : null,
  );
  const [pending, setPending] = useState(false);

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Free beta
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Join Field School University
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Beta members walk the campus for free. No card. Paid cohort and coaching
        plans will be invoiced later. See{" "}
        <Link href="/pricing" className="underline underline-offset-2">
          pricing
        </Link>
        .
      </p>
      {error ? (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <OAuthSignInButtons oauth={oauth} nextPath="/dashboard" tone="member" />
      </div>

      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          try {
            const res = await fetch("/api/members/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, password }),
            });
            const data = (await res.json()) as { error?: string };
            if (!res.ok) {
              setError(data.error || "Could not create that account.");
              return;
            }
            const signed = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });
            if (signed?.error) {
              setError(authErrorMessage(signed.error));
              return;
            }
            router.push("/dashboard");
          } catch {
            setError("Could not reach the campus. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="signup-name">Name</Label>
          <Input
            id="signup-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            required
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-email">Email</Label>
          <Input
            id="signup-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@work.com"
            required
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="signup-password">Password</Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
            className="h-11 rounded-xl"
          />
        </div>
        <Button className="h-12 w-full rounded-xl" type="submit" disabled={pending}>
          {pending ? "Joining…" : "Join the free beta"}
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted-foreground">
        Already on campus?{" "}
        <Link href="/login" className="underline underline-offset-2">
          Sign in
        </Link>
        .
      </p>

      <div className="mt-10 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Other ways in
        </p>
        <button
          type="button"
          className="h-12 w-full rounded-xl border border-border text-sm"
          onClick={() => {
            continueAsGuest();
            router.push("/c/grok-bot");
          }}
        >
          Continue as guest
        </button>
      </div>
    </main>
  );
}
