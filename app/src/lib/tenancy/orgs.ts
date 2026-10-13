export type PlannedOrg = {
  slug: string;
  name: string;
  kind: "family" | "team";
  homeschoolMode: boolean;
  createdBy: string;
  isolation: "strict" | "platform_plus";
  stance: "owner";
};

export function roomSlug(memberId: string, room: "family" | "team"): string {
  const tail = memberId.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12);
  return `${room}-${tail || "org"}`;
}

export function planRoomOrg(input: {
  memberId: string;
  memberName: string;
  room: "family" | "team";
  name?: string;
  homeschoolMode?: boolean;
}): PlannedOrg {
  const who = input.memberName.trim().slice(0, 60) || "New";
  const given = input.name?.trim().slice(0, 80);
  return {
    slug: roomSlug(input.memberId, input.room),
    name: given || (input.room === "family" ? `${who} family` : `${who} team`),
    kind: input.room,
    homeschoolMode: input.homeschoolMode === true,
    createdBy: input.memberId,
    isolation: input.room === "family" ? "strict" : "platform_plus",
    stance: "owner",
  };
}

export function inviteTarget(
  invite: { orgId: string; orgSlug: string },
  requestedSlug?: string,
): { orgId: string; orgSlug: string } {
  if (requestedSlug === invite.orgSlug) return { orgId: invite.orgId, orgSlug: invite.orgSlug };
  return { orgId: invite.orgId, orgSlug: invite.orgSlug };
}

export function switcherOrgs<T extends { memberId?: string; org: string }>(
  memberId: string,
  rows: readonly T[],
): Array<T & { readOnly: boolean }> {
  const seen = new Set<string>();
  const out: Array<T & { readOnly: boolean }> = [];
  for (const row of rows) {
    if (row.memberId && row.memberId !== memberId) continue;
    if (!row.org || seen.has(row.org)) continue;
    seen.add(row.org);
    out.push({ ...row, readOnly: row.org === "household" || row.org === "sales" });
  }
  return out;
}
