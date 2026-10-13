import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isStaffSession } from "@/lib/members/policy";
import { orgsForEmails, withStaffOrgs } from "@/lib/members/staff-orgs";
import { listAccessRequests } from "@/lib/members/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!isStaffSession(session)) {
    return NextResponse.json({ error: "Staff session required." }, { status: 401 });
  }
  const requests = await listAccessRequests();
  const orgs = await orgsForEmails(requests.map((row) => row.email));
  return NextResponse.json({ requests: withStaffOrgs(requests, orgs) });
}
