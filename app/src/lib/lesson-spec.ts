/**
 * One LessonSpec JSON drives learn, teach, and video.
 * Every unit must include source_unit_id. The parser refuses a unit that does not.
 */

export type LessonSpec = {
  id: string;
  org: string;
  title: string;
  outcome: string;
  units: { id: string; title: string; source_unit_id: string }[];
  mode: "teach" | "assign" | "video";
};

export type LessonSpecError = "invalid_json" | "invalid_spec" | "source_unit_id_required";

const LESSON_SPEC_MODES = ["teach", "assign", "video"] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isMode(value: unknown): value is LessonSpec["mode"] {
  return typeof value === "string" && (LESSON_SPEC_MODES as readonly string[]).includes(value);
}

export function parseLessonSpec(
  input: unknown,
): { spec: LessonSpec } | { error: LessonSpecError } {
  let value: unknown = input;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input) as unknown;
    } catch {
      return { error: "invalid_json" };
    }
  }

  if (!isRecord(value) || !Array.isArray(value.units)) {
    return { error: "invalid_spec" };
  }

  const id = nonEmptyString(value.id);
  const org = nonEmptyString(value.org);
  const title = nonEmptyString(value.title);
  const outcome = nonEmptyString(value.outcome);
  if (!id || !org || !title || !outcome || !isMode(value.mode)) {
    return { error: "invalid_spec" };
  }

  const units: LessonSpec["units"] = [];
  for (const unit of value.units) {
    if (!isRecord(unit)) return { error: "invalid_spec" };
    const sourceUnitId = nonEmptyString(unit.source_unit_id);
    if (!sourceUnitId) return { error: "source_unit_id_required" };
    const unitId = nonEmptyString(unit.id);
    const unitTitle = nonEmptyString(unit.title);
    if (!unitId || !unitTitle) return { error: "invalid_spec" };
    units.push({ id: unitId, title: unitTitle, source_unit_id: sourceUnitId });
  }

  return {
    spec: {
      id,
      org,
      title,
      outcome,
      units,
      mode: value.mode,
    },
  };
}
