import { isTemplateSlug } from "../tenancy/access.ts";
import { roomOf } from "../tenancy/kind.ts";

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
  const own = allowed.find(
    (slug) => slug !== HOUSEHOLD_SLUG && slug !== SALES_SLUG && slug !== OPERATOR_SLUG,
  );
  if (own) return own;
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

export function inviteStanceAllowed(orgSlug: string, stance: string, orgKind?: string) {
  const listed = INVITE_STANCES[orgSlug];
  if (listed) return listed.includes(stance);
  const room = orgKind ? roomOf(orgKind) : null;
  if (room === "family") return ["learner", "guardian", "owner"].includes(stance);
  if (room === "team") return ["learner", "trainer", "owner"].includes(stance);
  return stance === "learner" || stance === "owner";
}

export function canMintInvite(
  actor: { kind: string; stance: string; orgSlug: string },
  targetOrg: string,
  staff: boolean,
) {
  if (actor.kind === "child") return false;
  if (isTemplateSlug(targetOrg)) return false;
  if (actor.orgSlug !== targetOrg) return false;
  void staff;
  return (
    actor.stance === "admin" ||
    actor.stance === "guardian" ||
    actor.stance === "trainer" ||
    actor.stance === "owner"
  );
}

export function canListChildren(
  actor: { kind: string; stance: string; orgSlug: string; orgKind?: string },
  staff: boolean,
) {
  if (actor.kind === "child") return false;
  if (actor.orgSlug === SALES_SLUG || actor.orgSlug === OPERATOR_SLUG) return false;
  if (actor.orgSlug === HOUSEHOLD_SLUG) {
    return staff || actor.stance === "admin" || actor.stance === "guardian" || actor.stance === "owner";
  }
  return canCreateChild(actor, staff);
}

export function canCreateChild(
  actor: { kind: string; stance: string; orgSlug: string; orgKind?: string },
  staff: boolean,
) {
  if (actor.kind === "child") return false;
  if (isTemplateSlug(actor.orgSlug) || actor.orgSlug === OPERATOR_SLUG) return false;
  if (roomOf(actor.orgKind ?? "") !== "family") return false;
  return staff || actor.stance === "admin" || actor.stance === "guardian" || actor.stance === "owner";
}

export function childCanAdmin() {
  return false;
}

export function shouldForceOperatorOrg(opts: {
  staff: boolean;
  slugs: string[];
}) {
  void opts;
  return false;
}
