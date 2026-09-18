export const OPERATOR_SLUG = "field-school";
export const HOUSEHOLD_SLUG = "household";
export const SALES_SLUG = "sales";

export const INVITE_STANCES: Record<string, readonly string[]> = {
  [HOUSEHOLD_SLUG]: ["learner", "guardian"],
  [SALES_SLUG]: ["learner", "trainer"],
  [OPERATOR_SLUG]: ["learner", "admin"],
};

export function studentOrgs() {
  return [HOUSEHOLD_SLUG, SALES_SLUG] as const;
}

export function pickActiveSlug(
  requested: string,
  slugs: string[],
  memberKind: string,
) {
  const allowed = memberKind === "child"
    ? slugs.filter((s) => s !== SALES_SLUG)
    : slugs;
  if (requested && allowed.includes(requested)) return requested;
  if (allowed.includes(HOUSEHOLD_SLUG)) return HOUSEHOLD_SLUG;
  if (allowed.includes(SALES_SLUG)) return SALES_SLUG;
  return allowed[0] || "";
}

export function courseAllowedInOrg(orgSlug: string, course: string) {
  if (orgSlug === HOUSEHOLD_SLUG) return course === "home";
  if (orgSlug === SALES_SLUG) return course === "sales";
  return course === "grok-bot";
}

export function defaultInviteStance(orgSlug: string) {
  if (orgSlug === HOUSEHOLD_SLUG) return "guardian";
  if (orgSlug === SALES_SLUG) return "trainer";
  return "learner";
}

export function inviteStanceAllowed(orgSlug: string, stance: string) {
  return (INVITE_STANCES[orgSlug] ?? ["learner"]).includes(stance);
}

export function canMintInvite(
  actor: { kind: string; stance: string; orgSlug: string },
  targetOrg: string,
  staff: boolean,
) {
  if (actor.kind === "child") return false;
  if (staff) return true;
  if (actor.orgSlug !== targetOrg) return false;
  return actor.stance === "admin" || actor.stance === "guardian" || actor.stance === "trainer";
}

export function canCreateChild(
  actor: { kind: string; stance: string; orgSlug: string },
  staff: boolean,
) {
  if (actor.orgSlug !== HOUSEHOLD_SLUG) return false;
  if (actor.kind === "child") return false;
  return staff || actor.stance === "admin" || actor.stance === "guardian";
}

export function childCanAdmin() {
  return false;
}

export function shouldForceOperatorOrg(opts: {
  staff: boolean;
  slugs: string[];
}) {
  if (opts.staff) return false;
  const hasStudent = opts.slugs.some((slug) => slug === HOUSEHOLD_SLUG || slug === SALES_SLUG);
  return !hasStudent && opts.slugs.length === 0;
}
