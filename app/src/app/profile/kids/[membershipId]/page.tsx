"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { KidSetup } from "@/lib/profile/model";

type Kid = { membershipId: string; displayName: string; login: "none"; setup: KidSetup };

const ERRORS: Record<string, string> = {
  not_your_child: "This child is not on your household.",
  household_only: "Child profiles live in the Household room.",
  child_cannot_edit: "Only the parent edits this profile.",
  display_name_required: "Enter a name.",
  database_unavailable: "Profiles are not reachable right now.",
};

export default function KidProfilePage() {
  const params = useParams<{ membershipId: string }>();
  const search = useSearchParams();
  const kidView = search.get("view") === "kid";
  const membershipId = params.membershipId;
  const [kid, setKid] = useState<Kid | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch(`/api/profile/kids/${encodeURIComponent(membershipId)}`)
      .then(async (res) => {
        const data = (await res.json()) as { error?: string; kid?: Kid };
        if (cancelled) return;
        if (!res.ok || !data.kid) {
          setError(ERRORS[data.error || ""] || "Could not load this profile.");
          return;
        }
        setKid(data.kid);
        setName(data.kid.displayName);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the portal.");
      });
    return () => {
      cancelled = true;
    };
  }, [membershipId]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch(`/api/profile/kids/${encodeURIComponent(membershipId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: name }),
      });
      const data = (await res.json()) as { error?: string; kid?: Kid };
      if (!res.ok || !data.kid) {
        setStatus(ERRORS[data.error || ""] || "Could not save that.");
        return;
      }
      setKid(data.kid);
      setStatus("Saved.");
    } catch {
      setStatus("Could not reach the portal.");
    } finally {
      setSaving(false);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="h-section">Child profile</h1>
        <p className="mt-3 text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!kid) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </main>
    );
  }

  const base = `/profile/kids/${kid.membershipId}`;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10" data-kid-view={kidView ? "read-only" : "parent"}>
      <section className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {kidView ? "Child view · read-only" : "Child profile · you edit"}
          </p>
          <h1 className="h-section">{kid.displayName}</h1>
          <p className="text-xs text-muted-foreground">Tracked child. No login. No public link.</p>
        </div>
        <Link href={kidView ? base : `${base}?view=kid`} className="text-sm underline underline-offset-4">
          {kidView ? "Back to edit" : "See child view"}
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card px-5 py-4" data-profile-state={kid.setup.complete ? "complete" : "setup"}>
        <p className="text-sm font-semibold" role="status">
          {kid.setup.headline}
        </p>
        {kidView ? null : (
          <ul className="mt-3 divide-y divide-border">
            {kid.setup.gates.map((gate) => (
              <li key={gate.id} data-gate={gate.id} className="py-2">
                <p className="text-sm">
                  <span aria-hidden="true">{gate.done ? "✓ " : "○ "}</span>
                  {gate.label}
                </p>
                <p className="text-xs text-muted-foreground">{gate.feed}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {kidView ? null : (
        <section className="rounded-xl border border-border bg-card px-5 py-5">
          <h2 className="text-sm font-semibold">Edit</h2>
          <form className="mt-4 space-y-4" onSubmit={save}>
            <div>
              <label className="label" htmlFor="kid-name">
                Name on the profile
              </label>
              <input
                id="kid-name"
                className="input"
                value={name}
                maxLength={80}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">Child profiles have no photo.</p>
            <div className="flex items-center gap-3">
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Saving…" : "Save"}
              </button>
              {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
            </div>
          </form>
        </section>
      )}

      <p className="text-sm">
        <Link href="/profile" className="underline underline-offset-4">
          Back to your profile
        </Link>
      </p>
    </main>
  );
}
