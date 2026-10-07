export function runStatus(state: string) {
  const table: Record<string, { icon: string; word: string }> = {
    draft: { icon: "○", word: "Draft" },
    decompose: { icon: "✎", word: "Confirm requirements" },
    analyze: { icon: "…", word: "Scoring" },
    formulate: { icon: "…", word: "Writing a request" },
    waiting_on_user: { icon: "!", word: "Waiting on you" },
    integrate: { icon: "…", word: "Adding material" },
    rescore: { icon: "…", word: "Scoring again" },
    paused: { icon: "❚❚", word: "Paused" },
    done: { icon: "✓", word: "Done" },
    capped: { icon: "❚❚", word: "Paused at your limit" },
    stalled: { icon: "!", word: "Stuck" },
    cancelled: { icon: "×", word: "Archived" },
  };
  return table[state] || { icon: "○", word: "Draft" };
}

export function GoalBar({
  title,
  statement,
  state,
  coverageLabel,
  busy,
  onPause,
  onResume,
  onArchive,
}: {
  title: string;
  statement: string;
  state: string;
  coverageLabel: string;
  busy: boolean;
  onPause: () => void;
  onResume: () => void;
  onArchive: () => void;
}) {
  const status = runStatus(state);
  const terminal = state === "done" || state === "cancelled";
  return (
    <header className="rounded-2xl border border-border bg-card px-4 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Goal</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">{title}</h1>
        </div>
        <p className="rounded-full border border-border px-3 py-1 text-sm" aria-live="polite">
          <span aria-hidden="true">{status.icon} </span>
          {status.word}
        </p>
      </div>
      <p className="mt-3 max-w-3xl text-sm text-muted-foreground">{statement}</p>
      <p className="mt-2 text-sm">{coverageLabel}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {state === "paused" ? (
          <button type="button" className="rounded-full border border-border px-3 py-1 text-sm" disabled={busy} onClick={onResume}>
            Resume
          </button>
        ) : null}
        {!terminal && state !== "paused" ? (
          <button type="button" className="rounded-full border border-border px-3 py-1 text-sm" disabled={busy} onClick={onPause}>
            Pause
          </button>
        ) : null}
        {!terminal ? (
          <button type="button" className="rounded-full border border-border px-3 py-1 text-sm" disabled={busy} onClick={onArchive}>
            Archive
          </button>
        ) : null}
      </div>
    </header>
  );
}
