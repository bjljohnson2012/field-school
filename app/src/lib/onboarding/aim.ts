/**
 * First goal writes the gap-loop aim store (outcomes). No second aim table.
 */

export const AIM_STORE = "outcomes" as const;

export function firstGoalInput(statement: string) {
  const aim = statement.replace(/\s+/g, " ").trim();
  return {
    store: AIM_STORE,
    ownerKind: "person" as const,
    statement: aim,
    title: aim.slice(0, 140),
    horizon: "",
  };
}
