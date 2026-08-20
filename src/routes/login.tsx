import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import {
  GROK_PROVIDERS,
  authClient,
  authEnabled,
  signIn,
} from "@/lib/auth/client";
import { GuestContinueDialog } from "@/components/guest-continue-dialog";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { UNI_SHORT } from "@/lib/course/types";
import { safeReturnPath } from "@/lib/course/share";
import { clearGuest, markGuest } from "@/lib/guest";

export const Route = createFileRoute("/login")({
  validateSearch: (s: Record<string, unknown>) => ({
    next: typeof s.next === "string" ? s.next : undefined,
  }),
  component: Login,
});

function Login() {
  const { next } = Route.useSearch();
  const dest = safeReturnPath(next);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"in" | "up">("up");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [guestOpen, setGuestOpen] = useState(false);

  async function onEmail(e: FormEvent) {
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
      clearGuest();
      window.location.href = dest;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  function continueAsGuest() {
    markGuest();
    window.location.assign(dest);
  }

  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main className="mx-auto grid min-h-[calc(100dvh-3.5rem)] max-w-md place-items-center px-4 py-12">
        <div className="w-full rounded-xl border border-border bg-surface p-6 md-card">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">
            {UNI_SHORT}
          </p>
          <h1 className="mt-2 font-display text-3xl tracking-tight">
            Campus account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Sign in with Google, X, or email to keep a dashboard across devices.
            Guests can still open the catalog — progress stays in this browser
            until you leave the page.
          </p>

          <form className="mt-6 space-y-3" onSubmit={(e) => void onEmail(e)}>
            <input
              className="md-field h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
              type="email"
              required
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <input
              className="md-field h-11 w-full rounded-md border border-border bg-bg px-3 text-sm"
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
              className="md-interactive h-11 w-full rounded-xl text-sm text-muted"
              onClick={() => setMode(mode === "up" ? "in" : "up")}
            >
              {mode === "up"
                ? "Already have an account? Sign in"
                : "Need an account? Create one"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.16em] text-faint">
            <span className="h-px flex-1 bg-border" />
            Or
            <span className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={() => setGuestOpen(true)}
          >
            Continue as guest
          </Button>
          <p className="mt-2 text-center text-xs text-faint">
            Guest progress is saved here while you stay. Exit the page and it is
            gone. Share any course without an account.
          </p>

          {authEnabled ? (
            <div className="mt-4 space-y-2">
              {GROK_PROVIDERS.map((p) => (
                <button
                  key={p.providerId}
                  type="button"
                  onClick={() => {
                    clearGuest();
                    void signIn(p.providerId, { callbackURL: dest });
                  }}
                  className="md-interactive flex h-12 w-full items-center justify-center rounded-xl border border-border bg-raised text-sm font-medium"
                >
                  Continue with {p.label}
                </button>
              ))}
            </div>
          ) : null}

          <Link
            to="/"
            className="md-interactive mt-4 inline-flex h-11 items-center rounded-xl px-2 text-sm text-muted"
          >
            Back to campus
          </Link>
        </div>
      </main>
      <GuestContinueDialog
        open={guestOpen}
        showSignIn={false}
        onCancel={() => setGuestOpen(false)}
        onConfirm={continueAsGuest}
      />
    </div>
  );
}
