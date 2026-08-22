import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { notifyAccessRequest } from "@/lib/members/notify";
import { createAccessRequest } from "@/lib/members/store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await auth();
  let body: {
    name?: string;
    email?: string;
    provider?: string;
    note?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await createAccessRequest({
    name: body.name || session?.user?.name || "",
    email: body.email || session?.user?.email || "",
    provider: body.provider || session?.user?.provider || "unknown",
    note: body.note,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  try {
    const notify = await notifyAccessRequest(result.request);
    return NextResponse.json({
      ok: true,
      emailed: notify.emailed,
      request: result.request,
    });
  } catch (error) {
    console.error("[access-request] email failed", error);
    return NextResponse.json({
      ok: true,
      emailed: false,
      request: result.request,
      warning: "Request saved. Email notify did not send.",
    });
  }
}
