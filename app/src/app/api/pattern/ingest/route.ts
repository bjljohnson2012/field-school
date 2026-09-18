import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import {
  ProfileLockedError,
  ProfileMissingError,
  ingestArtifact,
  publicProfile,
} from "@/lib/pattern/profile";
import { transcribeWithGrokStt } from "@/lib/pattern/stt";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const auth = await identityFromRequest(request);
  if (!auth.ok) {
    return NextResponse.json({ ok: false, error: auth.error }, { status: auth.status });
  }
  if (auth.identity.orgSlug === "sales") {
    return NextResponse.json({ ok: false, error: "not_on_sales_board" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";
  let kind: "paper" | "verbal" | "video" = "paper";
  let transcript = "";
  let membershipId = auth.identity.membershipId;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const kindRaw = String(form.get("kind") || "verbal");
    kind = kindRaw === "video" ? "video" : kindRaw === "paper" ? "paper" : "verbal";
    membershipId = String(form.get("membership_id") || membershipId);
    const text = String(form.get("text") || "").trim();
    const file = form.get("file");
    if (text) transcript = text;
    else if (file && file instanceof File && file.size > 0) {
      const bytes = Buffer.from(await file.arrayBuffer());
      try {
        transcript = await transcribeWithGrokStt(bytes, file.name, file.type);
      } catch {
        return NextResponse.json({ ok: false, error: "stt_failed" }, { status: 502 });
      }
    }
  } else {
    let body: Record<string, unknown>;
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
    const kindRaw = typeof body.kind === "string" ? body.kind : "paper";
    kind = kindRaw === "video" ? "video" : kindRaw === "verbal" ? "verbal" : "paper";
    if (typeof body.membership_id === "string" && body.membership_id) {
      membershipId = body.membership_id;
    }
    transcript = typeof body.text === "string" ? body.text.trim() : "";
  }

  if (!transcript) {
    return NextResponse.json({ ok: false, error: "transcript_required" }, { status: 400 });
  }

  try {
    const out = await ingestArtifact({
      actor: auth.identity,
      membershipId,
      kind,
      transcript,
    });
    return NextResponse.json({
      ok: true,
      reset: false,
      profile: publicProfile(out.profile),
      result: out.result,
      artifactId: out.artifact.id,
    });
  } catch (error) {
    if (error instanceof ProfileLockedError) {
      return NextResponse.json({ ok: false, error: "profile_locked" }, { status: 403 });
    }
    if (error instanceof ProfileMissingError) {
      return NextResponse.json({ ok: false, error: "profile_required" }, { status: 409 });
    }
    throw error;
  }
}
