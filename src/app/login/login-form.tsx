"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { OAuthSignInButtons } from "@/components/oauth-sign-in-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortal } from "@/hooks/use-portal";
import { isAdminRoute } from "@/lib/admin-gate";
import type { OAuthProviderStatus } from "@/lib/auth/env";
import { authErrorMessage, isStaffSession } from "@/lib/members/policy";
import { continueAsGuest, signInLocal } from "@/lib/portal";

type Props = {
  oauth: OAuthProviderStatus;
};

export function LoginForm({ oauth }: Props) {
  const router = useRouter();
  const { data: authSession, status } = useSession();
  const { ready, isStaff } = usePortal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const next =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next") || ""
      : "";
  const oauthNext = isAdminRoute(next) ? next : "/dashboard";

  useEffect(() => {
    if (status === "authenticated" && isAdminRoute(next) && !isStaffSession(authSession)) {
      router.replace("/request-access?from=admin");
      return;
    }
    if (!ready || !isStaff) return;
    if (isAdminRoute(next)) router.replace(next);
  }, [ready, isStaff, router, next, status, authSession]);

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Portal
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Sign in</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Members use Google, X, or email and password. Staff admin still needs an
        allowlisted Google or X account. Local name sign-in never grants admin.
      </p>
      <p className="mt-3 text-sm">
        New here?{" "}
        <Link href="/signup" className="underline underline-offset-2">
          Join the free beta
        </Link>
        .
      </p>
      {error ? (
        <p className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-8">
        <OAuthSignInButtons
          oauth={oauth}
          nextPath={oauthNext}
          tone={isAdminRoute(next) ? "staff" : "member"}
        />
      </div>

      <form
        className="mt-8 space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError(null);
          try {
            const signed = await signIn("credentials", {
              email,
              password,
              redirect: false,
            });
            if (signed?.error) {
              setError(authErrorMessage(signed.error));
              return;
            }
            router.push(isAdminRoute(next) ? "/request-access?from=admin" : "/dashboard");
          } catch {
            setError("Could not reach the campus. Try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@work.com"
            required
            className="h-11 rounded-xl"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="h-11 rounded-xl"
          />
        </div>
        <Button className="h-12 w-full rounded-xl" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-10 space-y-3">
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          Other ways in
        </p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            signInLocal(name, email);
            router.push("/dashboard");
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="name">Name on the certificate</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              required
              className="h-11 rounded-xl"
            />
          </div>
          <Button className="h-12 w-full rounded-xl" variant="outline" type="submit">
            Keep a dashboard
          </Button>
        </form>
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
