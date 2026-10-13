import { eq, sql } from "drizzle-orm";
import { DatabaseUnavailableError, getDb } from "@/lib/db/client";
import { members, memberships, organizations } from "@/lib/db/schema";
import { staffEmail, withStaffOrgs, type StaffOrg } from "@/lib/members/staff-org-column";

export { withStaffOrgs, type StaffOrg };

export async function orgsForEmails(emails: string[]) {
  const unique = [...new Set(emails.map((email) => staffEmail(email)).filter(Boolean))];
  const map = new Map<string, StaffOrg[]>();
  for (const email of unique) map.set(email, []);
  if (!unique.length) return map;
  try {
    const db = getDb();
    const rows = await db
      .select({
        email: members.email,
        slug: organizations.slug,
        name: organizations.name,
      })
      .from(members)
      .innerJoin(memberships, eq(memberships.memberId, members.id))
      .innerJoin(organizations, eq(organizations.id, memberships.orgId))
      .where(sql`lower(${members.email}) = any(${unique})`);
    for (const row of rows) {
      const key = staffEmail(row.email);
      const list = map.get(key) ?? [];
      if (!list.some((org) => org.slug === row.slug)) {
        list.push({ slug: row.slug, name: row.name });
      }
      map.set(key, list);
    }
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return map;
    throw error;
  }
  return map;
}

export async function orgIdsForEmail(email: string) {
  const mail = staffEmail(email);
  if (!mail) return [];
  try {
    const db = getDb();
    const rows = await db
      .select({ orgId: memberships.orgId })
      .from(members)
      .innerJoin(memberships, eq(memberships.memberId, members.id))
      .where(sql`lower(${members.email}) = ${mail}`);
    return rows.map((row) => row.orgId);
  } catch (error) {
    if (error instanceof DatabaseUnavailableError) return [];
    throw error;
  }
}
