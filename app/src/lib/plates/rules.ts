export const PLATE_STATUSES = ["pending", "approved", "rejected"] as const;
export type PlateStatus = (typeof PLATE_STATUSES)[number];

export const LOCKED_JUST_ID = "27pn9xs0zk8a73g";
export const LOCKED_AUG30 = "vox/everything-made-up.mp4";

export function destAllowed(dest: string) {
  const value = String(dest || "");
  if (!value.trim()) return false;
  return !value.includes(LOCKED_JUST_ID) && !value.includes(LOCKED_AUG30);
}

export function decidePlate(status: string, action: "approve" | "reject") {
  if (status !== "pending") return { ok: false as const, error: "not_pending" };
  return { ok: true as const, status: action === "approve" ? "approved" : "rejected" };
}

export function plateVisibleTo(
  row: { orgId: string; status: string },
  actor: { orgId: string; kind: string; stance: string },
) {
  if (row.orgId !== actor.orgId) return false;
  if (row.status === "approved") return true;
  if (actor.kind === "child") return false;
  return ["admin", "guardian", "trainer", "teacher"].includes(actor.stance);
}

export function cleaningAutoFlipReady(input: {
  checklistExit: number;
  shipGreen: boolean;
  holdCleaning: boolean;
}) {
  return input.checklistExit === 0 && input.shipGreen && !input.holdCleaning;
}
