export const DEAN_EMAIL = "bjljohnson2012@gmail.com";

export const PROTECTED_ORG_SLUGS = new Set(["field-school", "household", "sales"]);

const DEMO_ORG = /^(demo|example|test)([-_\s]|$)/i;
const TEST_TOKEN = /(^|[.+_-])test([.+_@-]|$)/;

export type MemberRow = {
  id: string;
  email: string;
  kind: string;
  authUserId?: string | null;
  hasCredential?: boolean;
};

export type OrgRow = {
  id: string;
  slug: string;
  name: string;
};

export type MembershipRow = {
  id: string;
  orgId: string;
  memberId: string;
};

export type Verdict = "delete" | "keep" | "ambiguous";

export type TestRowPlan = {
  deleteMemberIds: string[];
  ambiguousMemberIds: string[];
  deleteOrgIds: string[];
  ambiguousOrgIds: string[];
  deleteMembershipIds: string[];
  counts: {
    members: number;
    memberships: number;
    organizations: number;
    ambiguous_members: number;
    ambiguous_orgs: number;
  };
};

export function classifyMember(member: MemberRow): Verdict {
  const email = member.email.trim().toLowerCase();
  if (email === DEAN_EMAIL) return "keep";
  if (clearTestEmail(email) || benTestAlias(email)) return "delete";
  if (member.kind === "child") return "keep";
  if (nonDeliverable(email)) return "delete";
  if (!member.authUserId && !member.hasCredential) return "ambiguous";
  return "keep";
}

export function planTestRows(input: {
  orgs: readonly OrgRow[];
  members: readonly MemberRow[];
  memberships: readonly MembershipRow[];
}): TestRowPlan {
  const deleteMemberIds = input.members.filter((row) => classifyMember(row) === "delete").map((row) => row.id);
  const ambiguousMemberIds = input.members
    .filter((row) => classifyMember(row) === "ambiguous")
    .map((row) => row.id);
  const deleteMembers = new Set(deleteMemberIds);
  const membersByOrg = new Map<string, string[]>();
  for (const membership of input.memberships) {
    const list = membersByOrg.get(membership.orgId) ?? [];
    list.push(membership.memberId);
    membersByOrg.set(membership.orgId, list);
  }
  const deleteOrgIds: string[] = [];
  const ambiguousOrgIds: string[] = [];
  for (const org of input.orgs) {
    if (PROTECTED_ORG_SLUGS.has(org.slug) || !isDemoOrg(org)) continue;
    const memberIds = [...new Set(membersByOrg.get(org.id) ?? [])];
    if (memberIds.length === 0 || memberIds.every((id) => deleteMembers.has(id))) {
      deleteOrgIds.push(org.id);
      continue;
    }
    ambiguousOrgIds.push(org.id);
  }
  const deleteOrgs = new Set(deleteOrgIds);
  const deleteMembershipIds = input.memberships
    .filter((row) => deleteMembers.has(row.memberId) || deleteOrgs.has(row.orgId))
    .map((row) => row.id);
  return {
    deleteMemberIds,
    ambiguousMemberIds,
    deleteOrgIds,
    ambiguousOrgIds,
    deleteMembershipIds,
    counts: {
      members: deleteMemberIds.length,
      memberships: deleteMembershipIds.length,
      organizations: deleteOrgIds.length,
      ambiguous_members: ambiguousMemberIds.length,
      ambiguous_orgs: ambiguousOrgIds.length,
    },
  };
}

export function deleteOrder(
  tables: readonly string[],
  edges: readonly { from: string; to: string }[],
): string[] {
  const nodes = [...new Set(tables)];
  const incoming = new Map(nodes.map((node) => [node, 0]));
  const next = new Map(nodes.map((node) => [node, [] as string[]]));
  for (const edge of edges) {
    if (edge.from === edge.to) continue;
    if (!incoming.has(edge.from) || !incoming.has(edge.to)) continue;
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
    next.get(edge.from)?.push(edge.to);
  }
  const queue = nodes.filter((node) => incoming.get(node) === 0);
  const out: string[] = [];
  while (queue.length) {
    const node = queue.shift();
    if (!node) break;
    out.push(node);
    for (const child of next.get(node) ?? []) {
      const left = (incoming.get(child) ?? 1) - 1;
      incoming.set(child, left);
      if (left === 0) queue.push(child);
    }
  }
  for (const node of nodes) {
    if (!out.includes(node)) out.push(node);
  }
  return out;
}

function isDemoOrg(org: OrgRow): boolean {
  return DEMO_ORG.test(org.slug) || DEMO_ORG.test(org.name);
}

function clearTestEmail(email: string): boolean {
  if (email.includes("@example.") || email.endsWith(".example")) return true;
  if (email.includes("@test.") || email.endsWith("@test.com") || email.endsWith(".test")) return true;
  if (email.includes("@mailinator.") || email.endsWith("@mailinator.com")) return true;
  if (TEST_TOKEN.test(email) || email.includes("+test")) return true;
  return false;
}

function benTestAlias(email: string): boolean {
  if (/^bjljohnson2012\+[^@]+@gmail\.com$/.test(email)) return true;
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  const testDomain =
    domain === "example.com" ||
    domain.endsWith(".example") ||
    domain.startsWith("example.") ||
    domain === "test.com" ||
    domain.endsWith(".test") ||
    domain.startsWith("test.");
  if (testDomain && /^(ben|benjamin|bjljohnson)([.+_-].*)?$/.test(local)) return true;
  if (/^(ben|benjamin)\+test($|[.+_@-])/.test(email)) return true;
  return false;
}

function nonDeliverable(email: string): boolean {
  return (
    email.endsWith("@localhost") ||
    email.endsWith(".localhost") ||
    email.endsWith("@invalid") ||
    email.endsWith(".invalid")
  );
}
