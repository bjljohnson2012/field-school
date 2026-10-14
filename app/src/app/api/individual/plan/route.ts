import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { copyWithConsent } from "@/lib/individual/plan";
import { billingPublicPayload, planPublicPayload } from "@/lib/individual/surface";

export const dynamic = "force-dynamic";

export async function GET() {
  const body = planPublicPayload({});
  return NextResponse.json({ ok: true, ...body });
}

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  const billing = billingPublicPayload();
  if (!billing.individual) {
    return NextResponse.json({ ok: false, error: "not_available" }, { status: 404 });
  }
  const body = (await request.json().catch(() => null)) as { action?: string; consent?: boolean } | null;
  if (body?.action === "share") {
    const copied = copyWithConsent({ consent: body.consent === true, items: [] });
    if (!copied.ok) return NextResponse.json({ ok: false, error: copied.error }, { status: 400 });
    return NextResponse.json({ ok: true, mode: copied.mode, items: copied.items });
  }
  return NextResponse.json({ ok: true, ...planPublicPayload({}) });
}
