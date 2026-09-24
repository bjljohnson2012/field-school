const CATEGORY_SLUG: Record<string, string> = {
  DISCOVERY: "coaching-discovery",
  OBJECTION_HANDLING: "objection-handling",
  CLOSING: "closing",
  COMMUNICATION: "communication",
  RESILIENCE: "resilience",
  PRODUCT_MASTERY: "product-mastery",
  LEADERSHIP: "leadership",
  FORECASTING: "forecasting",
};

export function onlyReviewCoach(
  review: { coachMembershipId: string },
  actorMembershipId: string,
) {
  return review.coachMembershipId === actorMembershipId;
}

export function resolveReviewSkillSlug(category: string, knownSlugs: readonly string[] = []) {
  const mapped = CATEGORY_SLUG[category.trim().toUpperCase()];
  if (mapped) return mapped;
  const raw = category.trim().toLowerCase();
  if (knownSlugs.includes(raw)) return raw;
  return null;
}

export function adjustedScore(prior: number, delta: number) {
  if (!Number.isFinite(prior) || !Number.isFinite(delta)) return null;
  return Math.max(0, Math.min(100, Math.round(prior + delta)));
}

export function followUpRecommendationRow(rec: {
  title?: string;
  description?: string;
  category?: string;
  routeTo?: string;
}) {
  const title = rec.title?.trim() ?? "";
  const body = rec.description?.trim() ?? "";
  if (!title || !body) return null;
  const routeTo = rec.routeTo === "coach" ? "coach" : "learner";
  return {
    source: "monthly_review" as const,
    category: rec.category?.trim() || "GENERAL",
    routeTo,
    channel: routeTo === "coach" ? ("note" as const) : ("task" as const),
    title,
    body,
    status: "open" as const,
  };
}
