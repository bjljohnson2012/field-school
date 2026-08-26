import { NextResponse } from "next/server";
import { emailAssessmentResult } from "@/lib/members/notify";
import { isValidEmail, normalizeEmail } from "@/lib/members/policy";
import { createFormSubmission } from "@/lib/members/store";
import { parseAssessmentShare } from "@/lib/tools/share";

export const runtime = "nodejs";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  if (!isRecord(body)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const record = body;
  if (typeof record.website === "string" && record.website.trim()) {
    return NextResponse.json({ ok: true, emailed: true });
  }

  const email = normalizeEmail(typeof record.email === "string" ? record.email : "");
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  const share = parseAssessmentShare(record.share);
  if (!share) {
    return NextResponse.json({ error: "Results are missing." }, { status: 400 });
  }

  await createFormSubmission({
    kind: "saturday_note",
    name: "",
    email,
    message: share.summary,
    source: `/tools/${share.toolSlug}`,
  });

  const sent = await emailAssessmentResult({
    email,
    title: share.title,
    lines: share.lines,
    summary: share.summary,
  });

  return NextResponse.json({
    ok: true,
    emailed: sent.emailed,
  });
}
