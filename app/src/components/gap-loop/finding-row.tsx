const GAP_STATUS: Record<string, string> = {
  open: "Open",
  asked: "Waiting on you",
  closing: "Closing",
  closed: "Closed",
  rejected: "Rejected",
  waived: "Waived",
};

export function FindingRow({
  summary,
  status,
  priority,
  busy,
  onReject,
  onWaive,
  onReopen,
}: {
  summary: string;
  status: string;
  priority: number;
  busy: boolean;
  onReject: (reason: string) => void;
  onWaive: () => void;
  onReopen: () => void;
}) {
  return (
    <li className="rounded-xl border border-border px-3 py-3">
      <p className="text-sm">{summary}</p>
      <p className="mt-1 text-xs text-muted-foreground">
        {GAP_STATUS[status] || "Open"} · priority {priority}
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {status !== "rejected" && status !== "waived" && status !== "closed" ? (
          <>
            <button type="button" className="text-xs underline underline-offset-2" disabled={busy} onClick={() => onReject("")}>
              Reject
            </button>
            <button type="button" className="text-xs underline underline-offset-2" disabled={busy} onClick={onWaive}>
              Waive
            </button>
          </>
        ) : null}
        {status === "rejected" ? (
          <button type="button" className="text-xs underline underline-offset-2" disabled={busy} onClick={onReopen}>
            Reopen
          </button>
        ) : null}
      </div>
    </li>
  );
}
