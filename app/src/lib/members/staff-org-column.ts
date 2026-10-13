export type StaffOrg = { slug: string; name: string };

export function staffEmail(email: string) {
  return email.trim().toLowerCase();
}

export function withStaffOrgs<T extends { email: string }>(
  rows: T[],
  orgs: Map<string, StaffOrg[]>,
) {
  return rows.map((row) => ({
    ...row,
    orgs: orgs.get(staffEmail(row.email)) ?? [],
  }));
}
