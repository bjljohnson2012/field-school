/**
 * M11 sealed brain rules. CDM sealed these on 2026-10-14, delegated by Ben.
 * An edge has no scope column. It takes scope from endpoints that already match.
 */

export const GAP_LOOP_NODE_KINDS = ["goal", "requirement", "concept", "cluster", "evidence"] as const;
export const M11_NODE_KINDS = ["lesson", "brain_page", "reflection", "skill", "project"] as const;
export const NODE_KINDS = [...GAP_LOOP_NODE_KINDS, ...M11_NODE_KINDS] as const;
export const EDGE_ORIGINS = ["system", "derived", "user", "ai"] as const;

export type NodeKind = (typeof NODE_KINDS)[number];
export type EdgeOrigin = (typeof EDGE_ORIGINS)[number];

export type NodeScope = {
  orgId: string;
  growthUnitId: string;
  ownerKind: string;
  ownerMembershipId: string;
  childMembershipId: string | null;
};

export function isNodeKind(value: string): value is NodeKind {
  return (NODE_KINDS as readonly string[]).includes(value);
}

export function isEdgeOrigin(value: string): value is EdgeOrigin {
  return (EDGE_ORIGINS as readonly string[]).includes(value);
}

/** AI suggestions stay proposed until a leader confirms. A user link is already confirmed. */
export function statusForOrigin(origin: EdgeOrigin): "proposed" | "accepted" {
  return origin === "user" ? "accepted" : "proposed";
}

export function isPendingSuggestion(edge: { origin: string; status: string }) {
  return edge.origin === "ai" && edge.status === "proposed";
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function scopeOfRow(row: Record<string, unknown> | null | undefined): NodeScope | null {
  if (!row) return null;
  const orgId = text(row.orgId ?? row.org_id);
  const growthUnitId = text(row.growthUnitId ?? row.growth_unit_id);
  const ownerKind = text(row.ownerKind ?? row.owner_kind);
  const ownerMembershipId = text(row.ownerMembershipId ?? row.owner_membership_id);
  if (!orgId || !growthUnitId || !ownerKind || !ownerMembershipId) return null;
  const child = row.childMembershipId ?? row.child_membership_id;
  return {
    orgId,
    growthUnitId,
    ownerKind,
    ownerMembershipId,
    childMembershipId: typeof child === "string" && child ? child : null,
  };
}

export function sameScope(left: NodeScope, right: NodeScope) {
  return (
    left.orgId === right.orgId &&
    left.growthUnitId === right.growthUnitId &&
    left.ownerKind === right.ownerKind &&
    left.ownerMembershipId === right.ownerMembershipId &&
    left.childMembershipId === right.childMembershipId
  );
}

/** Both endpoints must share a scope. The edge copies that scope. No separate column. */
export function scopeFromEndpoints(from: NodeScope | null, to: NodeScope | null): NodeScope | null {
  if (!from || !to) return null;
  if (!sameScope(from, to)) return null;
  return { ...from };
}

export function requireSharedEdgeScope(from: NodeScope | null, to: NodeScope | null): NodeScope {
  if (!from || !to) throw new Error("edge_endpoint_missing");
  const shared = scopeFromEndpoints(from, to);
  if (!shared) throw new Error("edge_scope_mismatch");
  return shared;
}
