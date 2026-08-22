"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Suspense, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

function RequestAccessInner() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const fromAdmin = searchParams.get("from") === "admin";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [emailed, setEmailed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filled = useMemo(() => {
    return {
      name: name || session?.user?.name || "",
      email: email || session?.user?.email || "",
    };
  }, [name, email, session]);

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Staff
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Request access
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {fromAdmin
          ? "That Google or X account is not on the staff allowlist. You can stay on campus as a free beta member, or ask the dean to add you."
          : "Staff admin is invite-only. Send a request and the dean will see it on the admin desk."}
      </p>

      {done ? (
        <div className="mt-8 rounded-xl border border-border bg-card px-5 py-5">
          <p className="text-sm leading-relaxed">
            Request saved
            {emailed ? " and emailed to the dean" : " for the dean to review"}
            . You still have free beta access.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
            >
              Go to dashboard
            </Link>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
            >
              Back to campus
            </Link>
          </div>
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setPending(true);
            setError(null);
            try {
              const res = await fetch("/api/access-requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: filled.name,
                  email: filled.email,
                  provider: session?.user?.provider || "unknown",
                  note,
                }),
              });
              const data = (await res.json()) as {
                error?: string;
                emailed?: boolean;
              };
              if (!res.ok) {
                setError(data.error || "Could not save that request.");
                return;
              }
              setEmailed(Boolean(data.emailed));
              setDone(true);
            } catch {
              setError("Could not reach the campus. Try again.");
            } finally {
              setPending(false);
            }
          }}
        >
          {error ? (
            <p className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="access-name">Name</Label>
            <Input
              id="access-name"
              value={name || session?.user?.name || ""}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-email">Email</Label>
            <Input
              id="access-email"
              type="email"
              value={email || session?.user?.email || ""}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-11 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="access-note">Note (optional)</Label>
            <Textarea
              id="access-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Why you need the staff desk"
              className="min-h-28 rounded-xl"
            />
          </div>
          <Button className="h-12 w-full rounded-xl" type="submit" disabled={pending}>
            {pending ? "Sending…" : "Submit request"}
          </Button>
          {status === "unauthenticated" ? (
            <p className="text-xs text-muted-foreground">
              You can send this without a session. Signing in first helps the
              dean match the provider.
            </p>
          ) : null}
        </form>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/dashboard" className="underline underline-offset-2">
          Stay on the student dashboard
        </Link>
        {" · "}
        <Link href="/signup" className="underline underline-offset-2">
          Join the free beta
        </Link>
      </p>
    </main>
  );
}

export function RequestAccessForm() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16">
          <p className="text-sm text-muted-foreground">Loading request form…</p>
        </main>
      }
    >
      <RequestAccessInner />
    </Suspense>
  );
}
