export type PortionUnit = { id: string; title: string; source_unit_id: string };

/** The stored next unit. A missing id falls back to the first unit on the spec. */
export function unitForPortion(units: PortionUnit[], nextUnitId: string | undefined): PortionUnit | null {
  if (units.length === 0) return null;
  if (nextUnitId) {
    const found = units.find((unit) => unit.id === nextUnitId);
    if (found) return found;
  }
  return units[0];
}

/**
 * Teach moves the stored portion to the following unit.
 * The last unit stays the portion so leave does not clear Next.
 */
export function portionAfterTeach(units: PortionUnit[], currentUnitId: string): PortionUnit | null {
  if (units.length === 0) return null;
  const index = units.findIndex((unit) => unit.id === currentUnitId);
  if (index < 0) return units[0];
  return units[Math.min(index + 1, units.length - 1)];
}

/** Leave drops the presenter index. Return reads the same stored unit. */
export function portionOnReturn(units: PortionUnit[], storedNextUnitId: string): PortionUnit | null {
  return unitForPortion(units, storedNextUnitId);
}

export type StoredPortionRow = {
  room: string;
  login: string;
  nextUnit?: string;
  membershipId?: string;
  ownsPath?: boolean;
  buyer?: boolean;
  kind?: string;
};

/** Open row for this room. Home is a child with no login. Sales is a team member who may sign in. */
export function storedPortionForRoom<T extends StoredPortionRow>(room: "household" | "sales", rows: T[]): T | null {
  return (
    rows.find((row) => {
      if (row.room !== room) return false;
      if (row.buyer === true || row.ownsPath === true) return false;
      if (row.kind === "child" && room === "sales") return false;
      if (typeof row.nextUnit === "string" && row.nextUnit.trim() === "") return false;
      if (room === "household") return row.login === "none";
      return row.login === "member";
    }) || null
  );
}
