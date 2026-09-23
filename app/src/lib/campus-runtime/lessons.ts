export type TenantLesson = {
  org: string;
  course: string;
  slug: string;
  objectId: string;
  title: string;
  body: string;
};

export const TENANT_LESSONS: TenantLesson[] = [
  {
    org: "household",
    course: "home",
    slug: "welcome",
    objectId: "home:welcome",
    title: "Household welcome",
    body: "This is a household lesson. It is not the Grok Bot catalog. Watch is a text station. Progress stays in this org.",
  },
  {
    org: "sales",
    course: "sales",
    slug: "welcome",
    objectId: "sales:welcome",
    title: "Welcome to the desk",
    body: "This is a sales-team lesson. Discovery, next step, hygiene. It does not mix with household.",
  },
];

export function lessonForOrg(orgSlug: string) {
  return TENANT_LESSONS.find((l) => l.org === orgSlug) ?? null;
}

export const HOUSEHOLD_SKILLS = [
  { slug: "morning", name: "Morning start", prompt: "Can they start the day without a fight?" },
  { slug: "chores", name: "Named chores", prompt: "Can they finish one named chore without a reminder loop?" },
  { slug: "read", name: "Read and tell", prompt: "Can they read a page and tell you what happened?" },
];

export const SALES_SKILLS = [
  { slug: "discovery", name: "Discovery", prompt: "Can they run a discovery call and name the pain in one sentence?" },
  { slug: "qualification", name: "Qualification", prompt: "Can they qualify next step vs. noise?" },
  { slug: "next-step", name: "Next step", prompt: "Can they leave a dated next step on every live deal?" },
];

export function skillsForOrg(orgSlug: string) {
  if (orgSlug === "household") return HOUSEHOLD_SKILLS;
  if (orgSlug === "sales") return SALES_SKILLS;
  return [];
}

/** AE categories. Distinct from the seeded 1–4 `discovery` desk slug. */
export const COACHING_SKILLS = [
  { slug: "coaching-discovery", name: "Discovery", scale: "0-100" as const, audience: "learner" as const },
  { slug: "objection-handling", name: "Objection handling", scale: "0-100" as const, audience: "learner" as const },
  { slug: "closing", name: "Closing", scale: "0-100" as const, audience: "learner" as const },
  { slug: "communication", name: "Communication", scale: "0-100" as const, audience: "learner" as const },
  { slug: "resilience", name: "Resilience", scale: "0-100" as const, audience: "learner" as const },
  { slug: "product-mastery", name: "Product mastery", scale: "0-100" as const, audience: "learner" as const },
  { slug: "leadership", name: "Leadership", scale: "0-100" as const, audience: "coach" as const },
  { slug: "forecasting", name: "Forecasting", scale: "0-100" as const, audience: "coach" as const },
];

export function skillScale(slug: string): "0-100" | "1-4" | null {
  if (COACHING_SKILLS.some((skill) => skill.slug === slug)) return "0-100";
  if (
    HOUSEHOLD_SKILLS.some((skill) => skill.slug === slug) ||
    SALES_SKILLS.some((skill) => skill.slug === slug)
  ) {
    return "1-4";
  }
  return null;
}

export function deskScoresRejection(
  orgSlug: string,
  scores: Record<string, unknown> | null | undefined,
): "slug_rejected" | "score_rejected" | null {
  const allowed = new Set(
    (orgSlug === "sales" ? SALES_SKILLS : orgSlug === "household" ? HOUSEHOLD_SKILLS : []).map(
      (skill) => skill.slug,
    ),
  );
  const coaching = new Set(COACHING_SKILLS.map((skill) => skill.slug));
  for (const [slug, score] of Object.entries(scores ?? {})) {
    if (coaching.has(slug) || !allowed.has(slug)) return "slug_rejected";
    if (typeof score !== "number" || !Number.isInteger(score) || score < 1 || score > 4) {
      return "score_rejected";
    }
  }
  return null;
}

export function refuseSkillScore(input: {
  orgSlug: string;
  skillSlug: string;
  scale: string | null | undefined;
  score: number;
}): "household" | "desk_slug" | "scale" | "score" | null {
  if (input.orgSlug === "household") return "household";
  if (HOUSEHOLD_SKILLS.some((skill) => skill.slug === input.skillSlug)) return "household";
  if (
    SALES_SKILLS.some((skill) => skill.slug === input.skillSlug) ||
    HOUSEHOLD_SKILLS.some((skill) => skill.slug === input.skillSlug)
  ) {
    return "desk_slug";
  }
  if (input.scale !== "0-100") return "scale";
  if (!Number.isFinite(input.score) || input.score < 0 || input.score > 100) return "score";
  return null;
}

export type CardSkill = {
  slug: string;
  name: string;
  scale: "0-100" | "1-4";
  audience: "learner" | "coach";
};

export function cardSkillsForOrg(orgSlug: string): CardSkill[] {
  if (orgSlug === "household") {
    return HOUSEHOLD_SKILLS.map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      scale: "1-4",
      audience: "learner",
    }));
  }
  if (orgSlug === "sales") {
    return [
      ...COACHING_SKILLS.map((skill) => ({
        slug: skill.slug,
        name: skill.name,
        scale: skill.scale,
        audience: skill.audience,
      })),
      ...SALES_SKILLS.map((skill) => ({
        slug: skill.slug,
        name: skill.name,
        scale: "1-4" as const,
        audience: "learner" as const,
      })),
    ];
  }
  return [];
}

export function personSurface(
  actorMembershipId: string,
  subjectMembershipId: string,
): "card" | "coach" {
  return actorMembershipId === subjectMembershipId ? "card" : "coach";
}

export function toPersonDto<T extends object>(
  surface: "card" | "coach",
  card: T,
  coach?: { hints: string[]; reasoning: string | null; hiddenNoteCount: number },
) {
  if (surface === "card") return { ...card };
  return {
    ...card,
    hints: coach?.hints ?? [],
    reasoning: coach?.reasoning ?? null,
    hiddenNoteCount: coach?.hiddenNoteCount ?? 0,
  };
}

/** /api/me wins once it has answered. A missing answer keeps the prop, including a false default. */
export function preferPlatformAdmin(fromApi: boolean | undefined, prop = false) {
  return typeof fromApi === "boolean" ? fromApi : prop;
}
