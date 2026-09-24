"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PrepItem = {
  id: string;
  status: string;
  error: string | null;
  prepDocText: string;
  generated: {
    prep?: { summary?: string; priorities?: string[]; closingMove?: string };
    crossReference?: { talkingPoints?: Array<{ point?: string }> };
  };
};

export function PrepPanel({
  subjectMembershipId,
  prep,
  coach,
}: {
  subjectMembershipId: string;
  prep: PrepItem | null;
  coach: boolean;
}) {
  const router = useRouter();
  const [prepDocText, setPrepDocText] = useState(prep?.prepDocText ?? "");
  const [crossReference, setCrossReference] = useState(false);
  const [confirmProfile, setConfirmProfile] = useState(false);
  const [personalitySummary, setPersonalitySummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function payload() {
    const profile =
      confirmProfile && personalitySummary.trim()
        ? { personalitySummary: personalitySummary.trim() }
        : undefined;
    return {
      subjectMembershipId,
      prepDocText,
      crossReference,
      confirmProfile,
      ...(profile ? { profile } : {}),
    };
  }

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/coaching/preps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not prepare the 1:1");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    if (!prep) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/coaching/preps/${prep.id}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload()),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not retry the 1:1");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const summary = prep?.generated.prep?.summary;
  const priorities = prep?.generated.prep?.priorities ?? [];
  return (
    <div className="mt-6 grid gap-6">
      <section className="card p-6">
        <h2 className="h-section">1:1 prep</h2>
        {!prep ? <p className="mt-4 text-sm text-muted-foreground">No prep yet.</p> : null}
        {prep ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{prep.status}</p>
            {summary ? <p className="mt-2 text-sm text-muted-foreground">{summary}</p> : null}
            {priorities.length ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {priorities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
            {prep.status === "failed" && prep.error ? <p className="mt-2 text-sm text-destructive">{prep.error}</p> : null}
          </div>
        ) : null}
      </section>
      {coach ? (
        <section className="card p-6">
          <h2 className="h-section">Prep doc</h2>
          <label className="label mt-4" htmlFor="prep-doc">
            Prep doc text
          </label>
          <textarea
            id="prep-doc"
            className="input"
            rows={8}
            value={prepDocText}
            onChange={(event) => setPrepDocText(event.target.value)}
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={crossReference}
              onChange={(event) => setCrossReference(event.target.checked)}
            />
            Cross-reference the prep doc
          </label>
          <label className="label mt-4" htmlFor="prep-profile">
            Personality summary
          </label>
          <textarea
            id="prep-profile"
            className="input"
            rows={3}
            value={personalitySummary}
            onChange={(event) => setPersonalitySummary(event.target.value)}
          />
          <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <input
              type="checkbox"
              checked={confirmProfile}
              onChange={(event) => setConfirmProfile(event.target.checked)}
            />
            Confirm coaching profile update
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={busy || !prepDocText.trim()} onClick={() => void generate()}>
              Generate
            </button>
            {prep ? (
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void retry()}>
                Retry
              </button>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="card p-6">
          <p className="text-sm text-muted-foreground">1:1 prep stays with the coach.</p>
        </section>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
