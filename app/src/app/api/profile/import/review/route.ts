import { NextResponse } from "next/server";
import { adultOnly, refuse, unavailable } from "@/lib/assessments/actor";
import { linkedInReviewList } from "@/lib/enrichment/import-plan";
import { LINKEDIN_COPY, LINKEDIN_PDF_MAX_BYTES, parseProfileUrl } from "@/lib/enrichment/linkedin";
import { pdfText } from "@/lib/enrichment/pdf-text";
import { proposeResumeForMember } from "@/lib/enrichment/resume-run";
import { reviewCandidates } from "@/lib/enrichment/store";

export const dynamic = "force-dynamic";

/**
 * A profile link alone returns `pdf_required`: the link is a label, never fetched.
 * An uploaded "Save to PDF" export is read in memory into a review list. Nothing is stored.
 */
export async function POST(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    if (Number(request.headers.get("content-length") ?? 0) > LINKEDIN_PDF_MAX_BYTES + 64 * 1024) {
      return refuse(413, "pdf_too_large");
    }
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      return refuse(400, "form_invalid");
    }
    const rawUrl = form.get("profileUrl");
    const profileUrl = typeof rawUrl === "string" && rawUrl.trim() ? parseProfileUrl(rawUrl) : null;
    if (typeof rawUrl === "string" && rawUrl.trim() && !profileUrl) return refuse(400, "profile_url_invalid");
    const file = form.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return NextResponse.json({ ok: true, kind: "pdf_required", profileUrl, message: LINKEDIN_COPY.pdfRequired });
    }
    if (file.size > LINKEDIN_PDF_MAX_BYTES) return refuse(413, "pdf_too_large");
    const text = await pdfText(new Uint8Array(await file.arrayBuffer()));
    if (text === null) return refuse(422, "pdf_unreadable");
    const linked = linkedInReviewList(text);
    if (linked) {
      const items = await reviewCandidates(auth.actor.owner, linked);
      return NextResponse.json({
        ok: true,
        kind: "review",
        source: "linkedin",
        profileUrl,
        items,
        hint: LINKEDIN_COPY.reviewHint,
      });
    }
    const proposed = await proposeResumeForMember({
      memberId: auth.actor.owner.memberId,
      orgSlug: auth.actor.orgSlug,
      adult: auth.actor.kind !== "child",
      text,
    });
    if (!proposed.ok) {
      const status = proposed.error === "task_cap" || proposed.error === "month_cap" ? 429 : 422;
      return refuse(status, proposed.error);
    }
    const items = await reviewCandidates(auth.actor.owner, proposed.items);
    return NextResponse.json({
      ok: true,
      kind: "review",
      source: "resume",
      profileUrl,
      items,
      hint: LINKEDIN_COPY.reviewHint,
    });
  } catch (error) {
    return unavailable(error);
  }
}
