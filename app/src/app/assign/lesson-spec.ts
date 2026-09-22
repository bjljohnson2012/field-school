export type LessonSpec = {
  id: string;
  org: string;
  title: string;
  outcome: string;
  units: { id: string; title: string; source_unit_id: string }[];
  mode: "teach" | "assign" | "video";
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function parseLessonSpec(value: unknown): LessonSpec | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  const id = text(row.id);
  const org = text(row.org);
  const title = text(row.title);
  const outcome = text(row.outcome);
  if (!id || !org || !title || !outcome) return null;
  if (row.mode !== "teach" && row.mode !== "assign" && row.mode !== "video") return null;
  if (!Array.isArray(row.units) || row.units.length === 0) return null;
  const units: LessonSpec["units"] = [];
  for (const unit of row.units) {
    if (!unit || typeof unit !== "object") return null;
    const item = unit as Record<string, unknown>;
    const unitId = text(item.id);
    const unitTitle = text(item.title);
    const sourceUnitId = text(item.source_unit_id);
    if (!unitId || !unitTitle || !sourceUnitId) return null;
    units.push({ id: unitId, title: unitTitle, source_unit_id: sourceUnitId });
  }
  return { id, org, title, outcome, units, mode: row.mode };
}
