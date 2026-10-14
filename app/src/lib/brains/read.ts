import { getSql } from "@/lib/db/client";
import { isStaffEmail } from "@/lib/auth/staff";
import type { LearnerIdentity } from "@/lib/campus-runtime/identity";
import { roomOf as kindRoom } from "@/lib/tenancy/kind";
import { canSeeBrainNode, loadBrainGraph, type BrainEdge, type BrainNode, type BrainRow } from "./graph.ts";
import { applyM11Sql } from "./sql.ts";

type Row = Record<string, unknown>;

function text(row: Row, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function evidenceOf(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asNode(row: Row): BrainNode {
  const child = text(row, "child_membership_id");
  return {
    id: text(row, "id"),
    orgId: text(row, "org_id"),
    growthUnitId: text(row, "growth_unit_id"),
    ownerKind: text(row, "owner_kind"),
    ownerMembershipId: text(row, "owner_membership_id"),
    childMembershipId: child || null,
    kind: text(row, "kind"),
    label: text(row, "label"),
    body: text(row, "body"),
    refTable: text(row, "ref_table") || null,
    refId: text(row, "ref_id") || null,
    evidence: evidenceOf(row.evidence),
    status: text(row, "status"),
  };
}

function asEdge(row: Row): BrainEdge {
  return {
    id: text(row, "id"),
    orgId: text(row, "org_id"),
    fromNode: text(row, "from_node"),
    toNode: text(row, "to_node"),
    rel: text(row, "rel"),
    because: text(row, "because"),
    origin: text(row, "origin"),
    status: text(row, "status"),
    evidence: evidenceOf(row.evidence),
  };
}

function asBrain(row: Row): BrainRow {
  const created = row.created_at;
  const createdAt = created instanceof Date ? created.toISOString() : typeof created === "string" ? created : "";
  return {
    id: text(row, "id"),
    orgId: text(row, "org_id"),
    growthUnitId: text(row, "growth_unit_id"),
    status: text(row, "status"),
    createdAt,
  };
}

export function roomOfIdentity(identity: Pick<LearnerIdentity, "orgSlug" | "orgKind">): "household" | "sales" | null {
  if (identity.orgSlug === "household" || identity.orgSlug === "sales") return identity.orgSlug;
  const room = kindRoom(identity.orgKind);
  if (room === "family") return "household";
  if (room === "team") return "sales";
  return null;
}

export async function readLibraryBrain(
  identity: LearnerIdentity,
  filter: { growthUnitId?: string | null; childMembershipId?: string | null },
) {
  await applyM11Sql();
  const sql = getSql();
  const staff = isStaffEmail(identity.email);
  const brains = (await sql`
    SELECT id, org_id, growth_unit_id, status, created_at
    FROM knowledge_brains
    WHERE org_id = ${identity.orgId}
  `) as Row[];
  const nodeRows = (await sql`
    SELECT id, org_id, growth_unit_id, owner_kind, owner_membership_id, child_membership_id,
           kind, label, body, ref_table, ref_id, evidence, status
    FROM knowledge_nodes
    WHERE org_id = ${identity.orgId}
  `) as Row[];
  const edgeRows = (await sql`
    SELECT id, org_id, from_node, to_node, rel, because, origin, status, evidence
    FROM knowledge_edges
    WHERE org_id = ${identity.orgId}
      AND status <> 'rejected'
  `) as Row[];
  const visibleNodes = nodeRows
    .map(asNode)
    .filter((node) => canSeeBrainNode(identity, node, staff));
  const graph = loadBrainGraph({
    brains: brains.map(asBrain),
    nodes: visibleNodes,
    edges: edgeRows.map(asEdge),
    filter: {
      orgId: identity.orgId,
      room: roomOfIdentity(identity),
      growthUnitId: filter.growthUnitId || null,
      childMembershipId: filter.childMembershipId || null,
    },
  });
  return {
    brainId: graph.brainId,
    nodes: graph.nodes.map((node) => ({
      id: node.id,
      kind: node.kind,
      label: node.label,
      refTable: node.refTable,
      refId: node.refId,
      evidence: node.evidence,
    })),
    edges: graph.edges.map((edge) => ({
      id: edge.id,
      fromNode: edge.fromNode,
      toNode: edge.toNode,
      rel: edge.rel,
      because: edge.because,
      origin: edge.origin,
      status: edge.status,
      pending: edge.origin === "ai" && edge.status === "proposed",
      evidence: edge.evidence,
    })),
  };
}

export async function setLibraryEdgeStatus(identity: LearnerIdentity, edgeId: string, status: "rejected" | "accepted") {
  await applyM11Sql();
  const sql = getSql();
  const rows = (await sql`
    UPDATE knowledge_edges
    SET status = ${status}
    WHERE id = ${edgeId}
      AND org_id = ${identity.orgId}
      AND (${status} <> 'accepted' OR origin = 'ai')
    RETURNING id, status, origin
  `) as Row[];
  const row = rows[0];
  if (!row) return null;
  return { id: text(row, "id"), status: text(row, "status"), origin: text(row, "origin") };
}
