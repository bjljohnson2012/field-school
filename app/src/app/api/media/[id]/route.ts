import { adultOnly, refuse, unavailable } from "@/lib/assessments/actor";
import { isUuid } from "@/lib/enrichment/model";
import { readMedia } from "@/lib/enrichment/store";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** A stored profile photo, for its owner only. */
export async function GET(request: Request, ctx: Params) {
  try {
    const auth = await adultOnly(request);
    if (!auth.ok) return auth.response;
    const { id } = await ctx.params;
    if (!isUuid(id)) return refuse(404, "media_not_found");
    const row = await readMedia(auth.actor.owner, id);
    if (!row) return refuse(404, "media_not_found");
    return new Response(new Uint8Array(row.bytes), {
      headers: {
        "Content-Type": row.mimeType,
        "Content-Length": String(row.bytes.length),
        "Cache-Control": "private, max-age=3600",
        ETag: `"${row.sha256}"`,
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Disposition": "inline",
      },
    });
  } catch (error) {
    return unavailable(error);
  }
}
