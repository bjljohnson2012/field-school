import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { FORM_LABELS } from "@/lib/members/forms";
import { isStaffSession } from "@/lib/members/policy";
import { orgsForEmails, withStaffOrgs } from "@/lib/members/staff-orgs";
import { listFormSubmissions } from "@/lib/members/store";
import { FORM_KINDS } from "@/lib/members/types";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!isStaffSession(session)) {
    return NextResponse.json({ error: "Staff session required." }, { status: 401 });
  }
  const submissions = await listFormSubmissions();
  const orgs = await orgsForEmails(submissions.map((row) => row.email));
  return NextResponse.json({
    submissions: withStaffOrgs(submissions, orgs),
    tabs: FORM_KINDS.map((kind) => ({
      kind,
      label: FORM_LABELS[kind],
      count: submissions.filter((row) => row.kind === kind).length,
    })),
  });
}
