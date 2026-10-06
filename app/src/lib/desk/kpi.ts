/** A desk headline number. Every value is derived from rows the desk already loaded; nothing is stored. */
export type Kpi = { id: string; label: string; value: string };

type Point = { id: string; value: number };

function pointValue(points: readonly Point[], id: string): number {
  return points.find((point) => point.id === id)?.value ?? 0;
}

export function insightsKpis(model: {
  empty: boolean;
  movement: readonly Point[];
  nextStep: readonly Point[];
  assignments: readonly Point[];
}): Kpi[] {
  if (model.empty) return [];
  return [
    { id: "moved", label: "Moved in 7 days", value: String(pointValue(model.movement, "moved")) },
    { id: "stalled", label: "Stalled", value: String(pointValue(model.movement, "stalled")) },
    { id: "no-portion", label: "No next portion", value: String(pointValue(model.nextStep, "no-portion")) },
    { id: "open", label: "Open assignments", value: String(pointValue(model.assignments, "open")) },
  ];
}

export function peopleKpis(input: {
  rows: readonly { membershipId: string }[];
  lines: readonly { membershipId: string; confidence: string; nextStep: string }[];
  kindLabel: string;
}): Kpi[] {
  const ids = new Set(input.rows.map((row) => row.membershipId));
  const mine = input.lines.filter((line) => ids.has(line.membershipId));
  return [
    { id: "people", label: input.kindLabel, value: String(ids.size) },
    { id: "next-step", label: "With a next step", value: String(mine.filter((line) => line.nextStep.trim()).length) },
    { id: "confidence", label: "With a note", value: String(mine.filter((line) => line.confidence.trim()).length) },
  ];
}

export function libraryKpis(input: {
  lessonIds: readonly string[];
  usedBy: ReadonlyMap<string, number>;
  sources: ReadonlyMap<string, number>;
}): Kpi[] {
  let used = 0;
  let sources = 0;
  for (const id of input.lessonIds) {
    if ((input.usedBy.get(id) ?? 0) > 0) used += 1;
    sources += input.sources.get(id) ?? 0;
  }
  return [
    { id: "published", label: "Published lessons", value: String(input.lessonIds.length) },
    { id: "used", label: "Used by a brain", value: String(used) },
    { id: "sources", label: "Sources", value: String(sources) },
  ];
}
