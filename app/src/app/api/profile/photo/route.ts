import { NextResponse } from "next/server";
import { adultOnly, refuse, unavailable } from "@/lib/assessments/actor";
import { PHOTO_MAX_BYTES } from "@/lib/enrichment/media";
import { removePhoto, setPhoto, type PhotoSource } from "@/lib/enrichment/store";

export const dynamic = "force-dynamic";

const REFUSAL_STATUS: Record<string, number> = {
  photo_too_large: 413,
  photo_type_unsupported: 415,
  photo_unreadable: 422,
  photo_dimensions: 422,
  photo_url_invalid: 400,
  photo_url_blocked: 400,
  photo_fetch_failed: 502,
};

async function source(request: Request): Promise<PhotoSource | "too_large" | null> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > PHOTO_MAX_BYTES + 64 * 1024) return "too_large";
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.startsWith("multipart/form-data")) {
      const file = (await request.formData()).get("file");
      if (!(file instanceof File)) return null;
      if (file.size > PHOTO_MAX_BYTES) return "too_large";
      return { kind: "upload", bytes: new Uint8Array(await file.arrayBuffer()) };
    }
    const body: unknown = await request.json();
    const url = typeof body === "object" && body !== null ? Object.getOwnPropertyDescriptor(body, "url")?.value : undefined;
    return typeof url === "string" ? { kind: "url", url } : null;
  } catch {
    return null;
  }
}

/** Upload a file, or paste a link that is fetched once. Either way the bytes live on campus. */
export async function POST(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    const input = await source(request);
    if (input === "too_large") return refuse(413, "photo_too_large");
    if (!input) return refuse(400, "photo_missing");
    const result = await setPhoto(auth.actor.owner, input);
    if (!result.ok) return refuse(REFUSAL_STATUS[result.error] ?? 400, result.error);
    return NextResponse.json({ ok: true, photoSrc: result.photoSrc });
  } catch (error) {
    return unavailable(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    await removePhoto(auth.actor.owner);
    return NextResponse.json({ ok: true, photoSrc: "" });
  } catch (error) {
    return unavailable(error);
  }
}
