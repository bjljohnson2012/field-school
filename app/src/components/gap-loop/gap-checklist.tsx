import { FindingRow } from "./finding-row";

const REQ_STATUS: Record<string, string> = {
  open: "Open",
  met: "Met",
  waived: "Waived",
};

export function GapChecklist({
  requirements,
  gaps,
  busy,
  onReject,
  onWaive,
  onReopen,
}: {
  requirements: {
    id: string;
    label: string;
    coverage: number;
    status: string;
    systemConfidence: string;
  }[];
  gaps: {
    id: string;
    requirementId: string;
    summary: string;
    status: string;
    priority: number;
  }[];
  busy: boolean;
  onReject: (gapId: string, reason: string) => void;
  onWaive: (gapId: string) => void;
  onReopen: (gapId: string) => void;
}) {
  return (
    <section aria-label="Checklist" className="rounded-2xl border border-border bg-card px-4 py-4">
      <h2 className="text-sm font-semibold">Checklist</h2>
      <ul className="mt-3 space-y-4">
        {requirements.map((requirement) => {
          const rows = gaps.filter((gap) => gap.requirementId === requirement.id);
          return (
            <li key={requirement.id}>
              <p className="text-sm font-medium">{requirement.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                <span aria-hidden="true">{requirement.status === "met" ? "✓ " : "○ "}</span>
                {REQ_STATUS[requirement.status] || "Open"} · {requirement.coverage}% · System confidence {requirement.systemConfidence}
              </p>
              {rows.length ? (
                <ul className="mt-2 space-y-2">
                  {rows.map((gap) => (
                    <FindingRow
                      key={gap.id}
                      summary={gap.summary}
                      status={gap.status}
                      priority={gap.priority}
                      busy={busy}
                      onReject={(reason) => onReject(gap.id, reason)}
                      onWaive={() => onWaive(gap.id)}
                      onReopen={() => onReopen(gap.id)}
                    />
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
