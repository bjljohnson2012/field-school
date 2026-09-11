"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type StatusResponse =
  | { status: "pending" }
  | { status: "missing" }
  | {
      status: "granted";
      email: string;
      seatLabel: string;
      planName: string;
      hasPassword: boolean;
      notes: string[];
    };

export function CheckoutSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id")?.trim() ?? "";
  const [status, setStatus] = useState<StatusResponse | null>(
    sessionId ? null : { status: "missing" },
  );
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      try {
        const res = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = (await res.json()) as StatusResponse;
        if (cancelled) return;
        if (data.status === "granted") {
          setStatus(data);
          return;
        }
        attempts += 1;
        if (attempts >= 20) {
          setStatus({ status: "pending" });
          return;
        }
        window.setTimeout(poll, 1500);
      } catch {
        if (!cancelled) window.setTimeout(poll, 2000);
      }
    };

    void poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const granted = status?.status === "granted" ? status : null;

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Paid
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">You're in.</h1>

      {!status || (status.status === "pending" && !granted) ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Stripe took the card. We are opening your seat now.
        </p>
      ) : null}

      {status?.status === "missing" ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          If you just paid, use the link Stripe sent you back with. Or sign in
          with the email on the card receipt.
        </p>
      ) : null}

      {status?.status === "pending" && sessionId ? (
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          The payment is still landing. Refresh this page in a minute. If it
          stays blank, email ben@fieldschool.ai with the address you paid with.
        </p>
      ) : null}

      {granted ? (
        <>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            {granted.planName} is your Field School seat. Log in with{" "}
            {granted.email}.
          </p>
          {granted.notes.length ? (
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              {granted.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
          {granted.hasPassword ? (
            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
              >
                Sign in
              </Link>
            </div>
          ) : (
            <form
              className="mt-8 space-y-4"
              onSubmit={async (event) => {
                event.preventDefault();
                setPending(true);
                setError(null);
                try {
                  const res = await fetch("/api/checkout/claim", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      session_id: sessionId,
                      name,
                      password,
                    }),
                  });
                  const data = (await res.json()) as { error?: string };
                  if (!res.ok) {
                    setError(data.error || "Could not set that password.");
                    return;
                  }
                  const signed = await signIn("credentials", {
                    email: granted.email,
                    password,
                    redirect: false,
                  });
                  if (signed?.error) {
                    router.push("/login");
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
              <p className="text-sm text-muted-foreground">
                Set a password for {granted.email}. A confirmation is on its
                way to that inbox.
              </p>
              {error ? (
                <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
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
              <Button className="h-12 w-full rounded-xl" type="submit" disabled={pending}>
                {pending ? "Saving…" : "Set password and enter"}
              </Button>
            </form>
          )}
        </>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm"
          >
            I already have a login
          </Link>
        </div>
      )}
    </main>
  );
}
