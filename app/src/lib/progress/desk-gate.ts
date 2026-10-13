import { NextResponse } from "next/server";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { admitDesk, progressDeskSecret, signedOrgFromUrl } from "@/lib/progress/desk-sign";

type IdentityLoader = typeof identityFromRequest;

export async function openHirePathDesk(
  request: Request,
  identity: IdentityLoader = identityFromRequest,
) {
  const url = new URL(request.url);
  const asked = url.searchParams.get("org")?.trim() || request.headers.get("x-fs-org")?.trim() || "";
  const signedOrg = signedOrgFromUrl(url, progressDeskSecret());
  if (signedOrg) {
    return admitDesk({
      signedOrg,
      asked,
      session: { ok: false, status: 401, error: "sign_in_required" },
    });
  }
  const auth = await identity(request);
  if (!auth.ok) {
    return admitDesk({
      signedOrg: null,
      asked,
      session: { ok: false, status: auth.status, error: auth.error },
    });
  }
  return admitDesk({
    signedOrg: null,
    asked,
    session: { ok: true, orgId: auth.identity.orgId, orgSlug: auth.identity.orgSlug },
  });
}

export async function refuseClosedDesk(request: Request) {
  const opened = await openHirePathDesk(request);
  if (opened.ok) return null;
  return NextResponse.json({ ok: false, error: opened.error }, { status: opened.status });
}
