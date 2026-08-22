"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { OAuthSignInButtons } from "@/components/oauth-sign-in-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { usePortal } from "@/hooks/use-portal";
import { isAdminRoute } from "@/lib/admin-gate";
import type { OAuthProviderStatus } from "@/lib/auth/env";
import { STUDENT_ID } from "@/lib/campus";
import { continueAsGuest, enterAs, signInLocal } from "@/lib/portal";

type Props = {
  oauth: OAuthProviderStatus;
};

export function LoginForm({ oauth }: Props) {
  const router = useRouter();
  const { ready, isStaff } = usePortal();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const next =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("next") || ""
      : "";

  useEffect(() => {
    if (!ready || !isStaff) return;
    if (isAdminRoute(next)) router.replace(next);
  }, [ready, isStaff, router, next]);

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Portal
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Sign in</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Students can label this browser or keep walking as a guest. Staff use
        Google or X when configured — local name sign-in never grants admin.
      </p>

      <div className="mt-8">
        <OAuthSignInButtons oauth={oauth} nextPath={isAdminRoute(next) ? next : "/admin"} />
      </div>

      <div className="mt-6 grid gap-3">
        <button
          type="button"
          className="h-12 rounded-xl border border-border px-5 text-sm"
          onClick={() => {
            enterAs(STUDENT_ID);
            router.push("/c/grok-bot");
          }}
        >
          Enter as Jordan · student demo
        </button>
      </div>

      <form
        className="mt-10 space-y-4"
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
        <div className="space-y-2">
          <Label htmlFor="email">Email (optional)</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@work.com"
            className="h-11 rounded-xl"
          />
        </div>
        <Button className="h-12 w-full rounded-xl" type="submit">
          Keep a dashboard
        </Button>
      </form>

      <button
        type="button"
        className="mt-4 h-12 w-full rounded-xl border border-border text-sm"
        onClick={() => {
          continueAsGuest();
          router.push("/c/grok-bot");
        }}
      >
        Continue as guest
      </button>
    </main>
  );
}
