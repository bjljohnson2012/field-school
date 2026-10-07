"use client";

import { useEffect, useState } from "react";
import type { PlacementView } from "@/lib/assessments/model";

type TrackResult = {
  track: string;
  label: string;
  latest: { placements: PlacementView[] } | null;
};

/** Finished reads on the adult profile. A firm category is one that locked at 75% or higher. */
export function AssessmentResults() {
  const [estimate, setEstimate] = useState<string | null>(null);
  const [tracks, setTracks] = useState<TrackResult[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/assessments")
      .then(async (res) => {
        const data = (await res.json()) as { copy?: { estimate?: string }; tracks?: TrackResult[] };
        if (cancelled || !res.ok || !data.tracks) return;
        setEstimate(data.copy?.estimate ?? null);
        setTracks(data.tracks);
      })
      .catch(() => {
        if (!cancelled) setTracks([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const shown = (tracks ?? []).flatMap((track) => {
    const placements = (track.latest?.placements ?? []).filter(
      (placement) => placement.state === "unsettled" || (placement.state === "locked" && placement.confidencePct >= 75),
    );
    return placements.length > 0 ? [{ ...track, placements }] : [];
  });
  if (shown.length === 0) return null;

  return (
    <section data-assessment-results className="rounded-xl border border-border bg-card px-5 py-5">
      <h2 className="text-sm font-semibold">Assessment results</h2>
      <div className="mt-3 space-y-4">
        {shown.map((track) => (
          <div key={track.track} data-result-track={track.track}>
            <h3 className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{track.label}</h3>
            <ul className="mt-1 divide-y divide-border">
              {track.placements.map((placement) => (
                <li
                  key={placement.taxonomy}
                  data-result={placement.taxonomy}
                  data-result-state={placement.state}
                  className="flex items-center justify-between gap-3 py-2"
                >
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
          </div>
        ))}
      </div>
      {estimate ? <p className="mt-3 text-xs text-muted-foreground">{estimate}</p> : null}
    </section>
  );
}
