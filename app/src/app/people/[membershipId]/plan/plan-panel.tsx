"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PlanItem = {
  id: string;
  status: string;
  error: string | null;
  generated: {
    title?: string;
    summary?: string;
    growthAreas?: Array<{ area?: string; why?: string; weeklyMoves?: string[] }>;
    weeklyHabits?: string[];
    ninetyDayCheckpoint?: string;
  };
};

export function PlanPanel({
  subjectMembershipId,
  plan,
  coach,
}: {
  subjectMembershipId: string;
  plan: PlanItem | null;
  coach: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/coaching/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectMembershipId }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not generate the plan");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function retry() {
    if (!plan) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/coaching/plans/${plan.id}/retry`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not retry the plan");
        return;
      }
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  const generated = plan?.generated ?? {};
  return (
    <div className="mt-6 grid gap-6">
      <section className="card p-6">
        <h2 className="h-section">Plan</h2>
        {!plan ? <p className="mt-4 text-sm text-muted-foreground">No plan yet.</p> : null}
        {plan ? (
          <div className="mt-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{plan.status}</p>
            {generated.title ? <h3 className="mt-2 font-semibold text-foreground">{generated.title}</h3> : null}
            {generated.summary ? <p className="mt-2 text-sm text-muted-foreground">{generated.summary}</p> : null}
            {plan.status === "failed" && plan.error ? <p className="mt-2 text-sm text-destructive">{plan.error}</p> : null}
            {generated.ninetyDayCheckpoint ? (
              <textarea className="input mt-4" readOnly rows={3} value={generated.ninetyDayCheckpoint} />
            ) : null}
            {Array.isArray(generated.growthAreas) ? (
              <ul className="mt-4 space-y-3">
                {generated.growthAreas.map((area) => (
                  <li key={area.area || area.why}>
                    <p className="font-semibold text-foreground">{area.area}</p>
                    {area.why ? <p className="text-sm text-muted-foreground">{area.why}</p> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {coach ? (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void generate()}>
              Generate
            </button>
            {plan ? (
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void retry()}>
                Retry
              </button>
            ) : null}
          </div>
        ) : null}
      </section>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
