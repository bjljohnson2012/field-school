import { NextResponse } from "next/server";
import { gapContext, gapError, isUuid } from "@/lib/gap-loop/access";
import { rescoreOwned } from "@/lib/gap-loop/advance";
import { deleteNode } from "@/lib/gap-loop/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ nodeId: string }> };

export async function DELETE(request: Request, { params }: Params) {
  try {
    const gate = await gapContext(request);
    if (!gate.ok) return gate.response;
    const { nodeId } = await params;
    if (!isUuid(nodeId)) return NextResponse.json({ ok: false, error: "unknown_node" }, { status: 404 });
    const outcomeId = await deleteNode(
      gate.actor,
      gate.staff,
      nodeId,
      request.headers.get("x-runner-id")?.trim() || crypto.randomUUID(),
    );
    await rescoreOwned(outcomeId);
    return NextResponse.json({ ok: true, outcomeId });
  } catch (error) {
    return gapError(error);
  }
}
