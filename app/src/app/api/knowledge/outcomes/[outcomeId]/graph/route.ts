import { NextResponse } from "next/server";
import { gapContext, gapError, isUuid } from "@/lib/gap-loop/access";
import { buildGapGraph, graphList, type GraphCitation } from "@/lib/gap-loop/graph";
import { cell, getWorkspace, loadBundle } from "@/lib/gap-loop/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ outcomeId: string }> };

function citations(value: unknown): GraphCitation[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const row = item as { table?: unknown; id?: unknown; label?: unknown };
      return {
        table: typeof row.table === "string" ? row.table : "",
        id: typeof row.id === "string" ? row.id : "",
        label: typeof row.label === "string" ? row.label : "",
      };
    })
    .filter((item) => item.table && item.id && item.label);
}

export async function GET(request: Request, { params }: Params) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const { outcomeId } = await params;
    if (!isUuid(outcomeId)) return NextResponse.json({ ok: false, error: "unknown_outcome" }, { status: 404 });
    await getWorkspace(gate.actor, gate.staff, outcomeId);
    const bundle = await loadBundle(outcomeId);
    if (!bundle) return NextResponse.json({ ok: false, error: "unknown_outcome" }, { status: 404 });
    const graph = buildGapGraph({
      nodes: bundle.nodes.map((row) => ({
        id: cell(row, "id"),
        kind: cell(row, "kind"),
        label: cell(row, "label"),
        requirementId: cell(row, "requirement_id") || null,
        evidence: citations(row.evidence),
      })),
      edges: bundle.edges.map((row) => ({
        id: cell(row, "id"),
        from: cell(row, "from_node"),
        to: cell(row, "to_node"),
        rel: cell(row, "rel"),
        status: cell(row, "status"),
        weight: Number(row.weight) || 1,
      })),
      gaps: bundle.gaps.map((row) => ({
        id: cell(row, "id"),
        requirementId: cell(row, "requirement_id"),
        summary: cell(row, "summary"),
        status: cell(row, "status"),
        evidence: citations(row.evidence),
      })),
    });
    const list = graphList(graph);
    return NextResponse.json({ ok: true, ...graph, list });
  } catch (error) {
    return gapError(error);
  }
}
