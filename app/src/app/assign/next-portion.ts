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
