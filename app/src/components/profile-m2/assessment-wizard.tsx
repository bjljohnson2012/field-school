"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { PlacementView, RunView } from "@/lib/assessments/model";
import { NeuralWeb } from "@/components/profile-m2/neural-web";
import type { TrackOverview } from "@/lib/assessments/store";
import type { TrackId } from "@/lib/assessments/tracks";
import { PROFILE_COPY, type AdultSetup } from "@/lib/profile/model";

type Copy = { name: string; estimate: string; unsettled: string; rerun: string };
type Track = TrackOverview & { refusal: string | null };
type Overview = { copy: Copy; tracks: Track[]; setup: AdultSetup };

const ERRORS: Record<string, string> = {
  sign_in_required: "Sign in to take assessments.",
  child_cannot_run_assessments: "Assessments are for adults. A child profile is kept by the parent.",
  not_on_sales_board: "Personality runs on the household board. Switch rooms to take it.",
  database_unavailable: "Assessments are not reachable right now.",
  answer_not_expected: "That question was already answered on another device. Here is the next one.",
};

const TRACKS: readonly TrackId[] = ["personality", "skills", "profile"];

function isTrack(value: string | null): value is TrackId {
  return TRACKS.some((track) => track === value);
}

function Meter({ value, label }: { value: number; label: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div
        className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="h-full rounded-full bg-foreground transition-[width] duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function Placements({ placements, copy }: { placements: PlacementView[]; copy: Copy }) {
  const unsettled = placements.some((placement) => placement.state === "unsettled");
  return (
    <div className="space-y-3">
      {unsettled ? (
        <p className="text-sm font-semibold" role="status">
          {copy.unsettled}
        </p>
      ) : null}
      <ul className="divide-y divide-border">
        {placements.map((placement) => (
          <li key={placement.taxonomy} data-placement={placement.state} className="flex items-center justify-between gap-3 py-2">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{placement.label}</p>
              <p className="text-sm font-semibold">{placement.categoryLabel}</p>
            </div>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
              {placement.state === "unsettled" ? "Best read · " : ""}
              {placement.confidencePct}% sure
            </span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{copy.estimate}</p>
    </div>
  );
}

function trackStatus(track: Track) {
  if (track.refusal) return "Not on this board";
  if (track.openRunId) return "In progress";
  if (track.lastCompletedAt) return `Done ${new Date(track.lastCompletedAt).toLocaleDateString()}`;
  return "Not started";
}

export function AssessmentWizard() {
  const params = useSearchParams();
  const [overview, setOverview] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [run, setRun] = useState<RunView | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/assessments");
    const data = (await res.json()) as Partial<Overview> & { error?: string };
    if (!res.ok || !data.tracks || !data.copy || !data.setup) {
      setError(ERRORS[data.error ?? ""] ?? "Could not load assessments.");
      return null;
    }
    const next = { copy: data.copy, tracks: data.tracks, setup: data.setup };
    setOverview(next);
    return next;
  }, []);

  const open = useCallback(async (track: TrackId) => {
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/assessments/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ track }),
      });
      const data = (await res.json()) as { run?: RunView; error?: string };
      if (!res.ok || !data.run) setNotice(ERRORS[data.error ?? ""] ?? "Could not start that track.");
      else setRun(data.run);
    } catch {
      setNotice("Could not reach the portal.");
    } finally {
      setBusy(false);
    }
  }, []);

  const requested = params.get("track");
  useEffect(() => {
    let cancelled = false;
    void refresh()
      .then((next) => {
        if (cancelled || !next || !isTrack(requested)) return;
        const track = next.tracks.find((entry) => entry.track === requested);
        if (track && !track.refusal && !track.lastCompletedAt) void open(requested);
      })
      .catch(() => {
        if (!cancelled) setError("Could not reach the portal.");
      });
    return () => {
      cancelled = true;
    };
  }, [refresh, open, requested]);

  async function answer(value: number) {
    if (!run?.next) return;
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/assessments/runs/${run.runId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: run.next.key, value }),
      });
      const data = (await res.json()) as { run?: RunView | null; error?: string };
      if (data.run) setRun(data.run);
      if (!res.ok) setNotice(ERRORS[data.error ?? ""] ?? "Could not save that answer.");
      if (data.run && data.run.status !== "in_progress") await refresh();
    } catch {
      setNotice("Could not reach the portal.");
    } finally {
      setBusy(false);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="h-section">Assessments</h1>
        <p className="mt-3 text-sm text-muted-foreground" role="alert">
          {error}
        </p>
      </main>
    );
  }

  if (!overview) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-sm text-muted-foreground">Loading assessments…</p>
      </main>
    );
  }

  const { copy, setup } = overview;
  const tracksDone = setup.gates.filter((gate) => gate.done).length;
  const label = (id: TrackId) => overview.tracks.find((track) => track.track === id)?.label ?? id;

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-10">
      <section className="rounded-xl border border-border bg-card px-5 py-4" data-wizard-overall={tracksDone}>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="h-section">{copy.name}</h1>
          <Link href="/profile" className="text-sm underline underline-offset-4">
            Back to profile
          </Link>
        </div>
        <p className="mt-1 text-sm text-foreground" role="status">
          {setup.complete ? PROFILE_COPY.complete : `${tracksDone} of 3 tracks done`}
        </p>
        <div className="mt-3">
          <Meter value={tracksDone / 3} label="Tracks done" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{copy.estimate}</p>
      </section>

      {run ? (
        <section className="rounded-xl border border-border bg-card px-5 py-5" data-run-status={run.status} data-track={run.track}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold">{label(run.track)}</h2>
            <button type="button" className="text-sm underline underline-offset-4" onClick={() => setRun(null)}>
              All tracks
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <Meter value={run.meter.progress} label="How sure we are" />
            <ul className="grid gap-2 sm:grid-cols-2">
              {run.meter.taxonomies.map((meter) => {
                const placement = run.placements.find((entry) => entry.taxonomy === meter.taxonomy);
                return (
                  <li key={meter.taxonomy} className="text-xs">
                    <Meter value={meter.progress} label={`${placement?.label ?? meter.taxonomy}${meter.settled ? " ✓" : ""}`} />
                  </li>
                );
              })}
            </ul>
          </div>

          {run.next ? (
            <fieldset className="mt-5" disabled={busy}>
              <legend className="text-base font-semibold">{run.next.prompt}</legend>
              <div className="mt-3 grid gap-2">
                {run.next.choices.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    className="rounded-lg border border-border px-4 py-3 text-left text-sm hover:bg-secondary disabled:opacity-50"
                    onClick={() => void answer(choice.value)}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            </fieldset>
          ) : (
            <div className="mt-5 space-y-4">
              <NeuralWeb title={label(run.track)} placements={run.placements} />
              <Placements placements={run.placements} copy={copy} />
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void open(run.track)}>
                {copy.rerun}
              </button>
            </div>
          )}
          {notice ? (
            <p className="mt-3 text-sm text-muted-foreground" role="alert">
              {notice}
            </p>
          ) : null}
        </section>
      ) : (
        <section className="grid gap-3">
          {overview.tracks.map((track) => (
            <article
              key={track.track}
              data-track-card={track.track}
              className="rounded-xl border border-border bg-card px-5 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">{track.label}</h2>
                  <p className="text-xs text-muted-foreground">{trackStatus(track)}</p>
                </div>
                {track.refusal ? null : (
                  <button type="button" className="btn-primary" disabled={busy} onClick={() => void open(track.track)}>
                    {track.openRunId ? "Continue" : track.lastCompletedAt ? copy.rerun : "Start"}
                  </button>
                )}
              </div>
              {track.refusal ? <p className="mt-2 text-xs text-muted-foreground">{ERRORS[track.refusal]}</p> : null}
              {track.latest && !track.openRunId ? (
                <div className="mt-3">
                  <Placements placements={track.latest.placements} copy={copy} />
                </div>
              ) : null}
            </article>
          ))}
          {notice ? (
            <p className="text-sm text-muted-foreground" role="alert">
              {notice}
            </p>
          ) : null}
        </section>
      )}
    </main>
  );
}
