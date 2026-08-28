import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffSession } from "@/lib/members/policy";
import { listAccessRequests } from "@/lib/members/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!isStaffSession(session)) {
    return NextResponse.json({ error: "Staff session required." }, { status: 401 });
  }
  const requests = await listAccessRequests();
  return NextResponse.json({ requests });
}
