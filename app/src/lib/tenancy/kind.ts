export type Room = "family" | "team";

const FAMILY = new Set(["family", "homeschool", "household"]);
const TEAM = new Set(["team", "company", "sales"]);

export function roomOf(kind: string): Room | null {
  const value = kind.trim().toLowerCase();
  if (FAMILY.has(value)) return "family";
  if (TEAM.has(value)) return "team";
  return null;
}

export function isHomeschool(org: { kind: string; homeschoolMode?: boolean | null }): boolean {
  const kind = org.kind.trim().toLowerCase();
  if (kind === "homeschool" || kind === "household") return true;
  return kind === "family" && org.homeschoolMode === true;
}

export type OrgKindRow = { kind: string; homeschoolMode: boolean };

export function applyHomeschoolUpdate<T extends OrgKindRow>(rows: readonly T[]): T[] {
  return rows.map((row) =>
    row.kind === "homeschool" ? { ...row, kind: "family", homeschoolMode: true } : row,
  );
}
