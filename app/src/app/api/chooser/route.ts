import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { chooseNext } from "@/lib/pattern/chooser";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await identityFromRequest();
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  const url = new URL(request.url);
  const course = url.searchParams.get("course")?.trim() || "grok-bot";
  const out = await chooseNext({ identity: auth.identity, course });
  return NextResponse.json({
    ok: true,
    ...out,
    wrotePack: false,
  });
}
