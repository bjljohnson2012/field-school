import { runStatus } from "./goal-bar";

export function LoopTimeline({
  events,
  sources,
  busy,
  onDelete,
}: {
  events: { seq: number; summary: string; fromState: string; toState: string; createdAt: string }[];
  sources: { id: string; label: string; filename: string }[];
  busy: boolean;
  onDelete: (nodeId: string) => void;
}) {
  return (
    <section aria-label="Timeline" className="rounded-2xl border border-border bg-card px-4 py-4">
      <h2 className="text-sm font-semibold">Timeline</h2>
      <ol className="mt-3 space-y-3">
        {events.length ? (
          events.map((event) => (
            <li key={event.seq} className="text-sm">
              <p>{event.summary}</p>
              <p className="text-xs text-muted-foreground">
                {runStatus(event.fromState).word} to {runStatus(event.toState).word}
              </p>
            </li>
          ))
        ) : (
          <li className="text-sm text-muted-foreground">No events yet.</li>
        )}
      </ol>
      {sources.length ? (
        <>
          <h3 className="mt-4 text-sm font-semibold">Sources</h3>
          <ul className="mt-2 space-y-2">
            {sources.map((source) => (
              <li key={source.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{source.filename || source.label}</span>
                <button type="button" className="text-xs underline underline-offset-2" disabled={busy} onClick={() => onDelete(source.id)}>
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}
