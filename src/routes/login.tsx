import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { UNI_NAME } from "@/lib/course/types";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("up");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === "up") {
        const { error: err } = await authClient.signUp.email({
          email,
          password,
          name: email.split("@")[0] ?? "Operator",
        });
        if (err) throw new Error(err.message);
      } else {
        const { error: err } = await authClient.signIn.email({ email, password });
        if (err) throw new Error(err.message);
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-md place-items-center px-4 py-12">
        <div className="w-full rounded-xl border border-border bg-surface p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            {UNI_NAME}
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Create an email and password to save progress, tool results, the
            desk, and a certificate. The catalog is open without an account.
          </p>

          <form className="mt-6 space-y-3" onSubmit={(e) => void onEmail(e)}>
            <input
              className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
              type="password"
              required
              minLength={8}
              placeholder="Password (8+)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "up" ? "new-password" : "current-password"}
            />
            {error ? <p className="text-sm text-warn">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={busy}>
              {busy
                ? "Working…"
                : mode === "up"
                  ? "Create campus account"
                  : "Sign in with email"}
            </Button>
            <button
              type="button"
              className="h-11 w-full text-sm text-muted hover:text-fg"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up"
                ? "Already have an account? Sign in"
                : "Need an account? Create one"}
            </button>
          </form>

          {authEnabled ? (
            <>
              <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-faint">
                <span className="h-px flex-1 bg-border" />
                Or
                <span className="h-px flex-1 bg-border" />
              </div>
              <div className="space-y-2">
                {GROK_PROVIDERS.map((p) => (
                  <button
                    key={p.providerId}
                    type="button"
                    onClick={() => signIn(p.providerId, { callbackURL: "/" })}
                    className="flex h-12 w-full items-center justify-center rounded-md border border-border bg-raised text-sm font-medium hover:bg-surface"
                  >
                    Continue with {p.label}
                  </button>
                ))}
              </div>
            </>
          ) : null}

          <Link
            to="/"
            className="mt-4 inline-flex h-11 items-center text-sm text-muted hover:text-fg"
          >
            Back to campus
          </Link>
        </div>
      </main>
    </div>
  );
}
