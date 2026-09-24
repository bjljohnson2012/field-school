"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { OAuthSignInButtons } from "@/components/oauth-sign-in-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortal } from "@/hooks/use-portal";
import { isAdminRoute, safeMemberNext } from "@/lib/admin-gate";
import type { OAuthProviderStatus } from "@/lib/auth/env";
import { visibleLoginProviderError } from "@/lib/auth/provider-error";
import { isStaffSession } from "@/lib/members/policy";
import { continueAsGuest, signInLocal } from "@/lib/portal";

type Props = {
  oauth: OAuthProviderStatus;
  coachingShell?: boolean;
};

function CoachMark() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 64 64"
      className="rounded-brand shadow-card"
      role="img"
      aria-label="Field School"
    >
      <defs>
        <linearGradient id="coach-mark-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1A1916" />
          <stop offset="1" stopColor="#1F5EFF" />
        </linearGradient>
        <linearGradient id="coach-mark-bolt" x1="20" y1="14" x2="44" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1F5EFF" />
          <stop offset="1" stopColor="#1A1916" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#coach-mark-bg)" />
      <rect x="14" y="38" width="6" height="14" rx="2" fill="#1F5EFF" opacity="0.55" />
      <rect x="24" y="30" width="6" height="22" rx="2" fill="#1F5EFF" opacity="0.75" />
      <rect x="34" y="22" width="6" height="30" rx="2" fill="#1F5EFF" opacity="0.95" />
      <path d="M44 14 L34 32 L41 32 L36 50 L52 28 L45 28 Z" fill="url(#coach-mark-bolt)" />
    </svg>
  );
}

export function LoginForm({ oauth, coachingShell = false }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: authSession, status } = useSession();
  const { ready, isStaff } = usePortal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() =>
    visibleLoginProviderError(searchParams.get("error"), oauth),
  );
  const [pending, setPending] = useState(false);

  const next = searchParams.get("next") || "";
  const memberNext = safeMemberNext(next);
  const oauthNext = isAdminRoute(next) ? next : memberNext;

  useEffect(() => {
    setError(visibleLoginProviderError(searchParams.get("error"), oauth));
  }, [oauth, searchParams]);

  useEffect(() => {
    if (status === "authenticated" && isAdminRoute(next) && !isStaffSession(authSession)) {
      router.replace("/request-access?from=admin");
      return;
    }
    if (status === "authenticated" && !isAdminRoute(next)) {
      router.replace(memberNext);
      return;
    }
    if (!ready || !isStaff) return;
    if (isAdminRoute(next)) router.replace(next);
  }, [ready, isStaff, router, next, memberNext, status, authSession]);

  if (coachingShell) {
    return (
      <div className="card w-full max-w-md p-8">
        <div className="mb-6 flex items-center gap-3">
          <CoachMark />
          <h1 className="font-display text-xl font-medium tracking-tight text-foreground">
            Field School
          </h1>
        </div>
        <form
          className="space-y-4"
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
                setError(visibleLoginProviderError(signed.error, oauth));
                return;
              }
              router.push(isAdminRoute(next) ? "/request-access?from=admin" : memberNext);
            } catch {
              setError("Could not reach the campus. Try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          <div>
            <label className="label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              required
              className="input"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@work.com"
            />
          </div>
          <div>
            <label className="label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              required
              className="input"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error ? (
            <div className="rounded-brand border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-md px-6 py-8">
      <div className="rounded-card border border-border bg-card p-8 shadow-card">
      <p className="eyebrow">Portal</p>
      <h1 className="h-page mt-2">Sign in</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Members use Google, X, or email and password. Staff admin still needs an
        allowlisted Google or X account. Local name sign-in never grants admin.
      </p>
      <p className="mt-3 text-sm">
        New here?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="underline underline-offset-2"
        >
          Join the free beta
        </Link>
        .
      </p>
      {error ? (
        <p className="mt-4 rounded-brand border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
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
              setError(visibleLoginProviderError(signed.error, oauth));
              return;
            }
            router.push(isAdminRoute(next) ? "/request-access?from=admin" : memberNext);
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
          />
        </div>
        <Button className="w-full" type="submit" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <div className="mt-10 space-y-3">
        <p className="eyebrow">Other ways in</p>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            signInLocal(name, email);
            router.push(memberNext);
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
            />
          </div>
          <Button className="w-full" variant="outline" type="submit">
            Keep a dashboard
          </Button>
        </form>
        <button
          type="button"
          className="w-full rounded-brand border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-all duration-200 ease-brand hover:bg-muted"
          onClick={() => {
            continueAsGuest();
            router.push("/c/grok-bot");
          }}
        >
          Continue as guest
        </button>
      </div>
      </div>
    </main>
  );
}
