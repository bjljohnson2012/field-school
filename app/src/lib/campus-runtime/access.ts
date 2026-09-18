import { forbidden, notFound, unauthorized } from "next/navigation";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { loadSession } from "./identity";
import { ensureTenantOrgs, getOrgBySlug } from "./org";
import { SALES_SLUG } from "./rules";

export async function assertOrgPageAccess(slug: string) {
  const session = await loadSession();
  if (!session) unauthorized();
  try {
    await ensureTenantOrgs();
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) {
      throw error;
    }
    throw error;
  }
  const org = await getOrgBySlug(slug);
  if (!org) notFound();
  const member = session.rows.some((row) => row.orgSlug === slug);
  if (!member || (session.member.kind === "child" && slug === SALES_SLUG)) {
    forbidden();
  }
  return { session, org };
}
