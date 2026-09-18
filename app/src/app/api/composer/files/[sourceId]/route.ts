import { readFileSync } from "node:fs";
import { NextResponse } from "next/server";
import { deny, requireMember } from "@/lib/composer/access";
import { canSeeDrafts } from "@/lib/composer/rules";
import { getSourceForOrg, sourceExistsInOtherOrg } from "@/lib/composer/store";
import { fileExists } from "@/lib/composer/uploads";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ sourceId: string }> },
) {
  const auth = await requireMember(request);
  if (!auth.ok) return auth.response;
  const { sourceId } = await context.params;
  const found = await getSourceForOrg(auth.identity.orgId, sourceId);
  if (!found) {
    const other = await sourceExistsInOtherOrg(sourceId, auth.identity.orgId);
    if (other.exists && other.otherOrg) return deny(403, "cross_org");
    return deny(404, "unknown_file");
  }
  if (found.lessonStatus !== "published" && !canSeeDrafts(auth.identity)) {
    return deny(404, "unknown_file");
  }
  if (!found.source.filePath || !fileExists(found.source.filePath)) {
    return deny(404, "unknown_file");
  }
  const bytes = readFileSync(found.source.filePath);
  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": found.source.mime || "application/octet-stream",
      "Content-Disposition": `inline; filename="${found.source.fileName || "upload"}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
