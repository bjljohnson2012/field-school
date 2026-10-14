import type { AdultGateId, GateMarks } from "./model.ts";

/**
 * One gate mark, merged by earliest firstAt and latest lastAt.
 * Either commit order of two concurrent writes leaves the same JSON.
 */
export function mergeGateMark(marks: GateMarks, id: AdultGateId, at: Date): GateMarks {
  const iso = at.toISOString();
  return mergeGateSpan(marks, id, { firstAt: iso, lastAt: iso });
}

export function mergeGateSpan(
  marks: GateMarks,
  id: AdultGateId,
  span: { firstAt: string; lastAt: string },
): GateMarks {
  const prior = marks[id];
  if (!prior) return { ...marks, [id]: { firstAt: span.firstAt, lastAt: span.lastAt } };
  return {
    ...marks,
    [id]: {
      firstAt: prior.firstAt < span.firstAt ? prior.firstAt : span.firstAt,
      lastAt: prior.lastAt > span.lastAt ? prior.lastAt : span.lastAt,
    },
  };
}
