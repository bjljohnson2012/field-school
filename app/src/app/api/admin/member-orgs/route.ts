import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffSession } from "@/lib/members/policy";
import { orgsForEmails } from "@/lib/members/staff-orgs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (!isStaffSession(session)) {
    return NextResponse.json({ error: "Staff session required." }, { status: 401 });
  }
  const emails = (new URL(request.url).searchParams.get("emails") ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);
  const found = await orgsForEmails(emails);
  return NextResponse.json({ orgs: Object.fromEntries(found) });
}
