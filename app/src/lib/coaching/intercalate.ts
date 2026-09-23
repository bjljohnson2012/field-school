import { forceCoachRoute } from "@/lib/ai/client";

export const SYNTHESIS_ORPHAN_MS = 3 * 60 * 1000;

export const DIRECTOR_INTAKE_CATEGORIES = [
  "PERSONALITY",
  "ENNEAGRAM",
  "DISC",
  "MBTI",
  "COMMUNICATION",
  "RESILIENCE",
  "MOTIVATION",
  "LEADERSHIP",
] as const;

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

export type IntakeQuestion = {
  id: string;
  category: string;
  productId?: string | null;
  questionType?: string;
  type?: string;
  text: string;
  options?: unknown;
  tags?: unknown;
};

export type ClientQuestion = {
  id: string;
  type: string;
  text: string;
  options: unknown;
};

export type RecommendationDraft = {
  title?: unknown;
  body?: unknown;
  description?: unknown;
  category?: unknown;
  routeTo?: unknown;
  route_to?: unknown;
  channel?: unknown;
  sourceArticleIds?: unknown;
  sourceUnitIds?: unknown;
};

export type RecommendationInsert = {
  source: "intake_synthesis";
  category: string;
  routeTo: "learner" | "coach";
  channel: "task" | "email" | "note";
  title: string;
  body: string;
  status: "open";
  sourceUnitIds: string[];
};

function groupKey(item: { category: string; productId?: string | null }) {
  return `${item.category}:${item.productId ?? ""}`;
}

function shuffle<T>(list: T[], random: () => number) {
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    const current = list[i];
    list[i] = list[j] as T;
    list[j] = current as T;
  }
}

/**
 * Group by category + product id, shuffle inside the group, then round-robin.
 * The same category is not adjacent unless that category is all that remains.
 */
export function intercalate<T extends { category: string; productId?: string | null }>(
  items: T[],
  random: () => number = Math.random,
): T[] {
  const groups = new Map<string, { category: string; items: T[] }>();
  for (const item of items) {
    const key = groupKey(item);
    const group = groups.get(key);
    if (group) group.items.push(item);
    else groups.set(key, { category: item.category, items: [item] });
  }
  for (const group of groups.values()) shuffle(group.items, random);

  const out: T[] = [];
  let lastCategory: string | null = null;
  while (groups.size > 0) {
    const entries = [...groups.entries()]
      .filter(([, group]) => group.items.length > 0)
      .sort((a, b) => b[1].items.length - a[1].items.length || a[0].localeCompare(b[0]));
    if (!entries.length) break;
    const pick = entries.find(([, group]) => group.category !== lastCategory) ?? entries[0];
    if (!pick) break;
    const [key, group] = pick;
    const next = group.items.shift();
    if (!next) break;
    out.push(next);
    lastCategory = group.category;
    if (group.items.length === 0) groups.delete(key);
  }
  return out;
}

export function clientQuestion(question: {
  id: string;
  type?: string;
  questionType?: string;
  text: string;
  options?: unknown;
}): ClientQuestion {
  return {
    id: question.id,
    type: question.type || question.questionType || "LONG_FORM",
    text: question.text,
    options: question.options ?? null,
  };
}

export function advanceResumeIndex(current: number, requested: number, length: number) {
  const bounded = Math.max(0, Math.min(Math.max(length, 0), requested));
  return Math.max(current, bounded);
}

export function directorIntakeAllowed(input: {
  stance: string;
  capabilities: readonly string[];
  platformAdmin: boolean;
}) {
  if (input.platformAdmin) return true;
  const allowed = new Set(["coach", "leader", "admin"]);
  if (allowed.has(input.stance)) return true;
  return input.capabilities.some((capability) => allowed.has(capability));
}

export function skillSlugForCategory(category: string) {
  return CATEGORY_SLUG[category.trim().toUpperCase()] ?? null;
}

export function synthesisIsStale(
  status: string | null | undefined,
  startedAt: Date | string | null | undefined,
  now = Date.now(),
) {
  if (status !== "generating") return false;
  if (!startedAt) return true;
  const at = new Date(startedAt).getTime();
  if (!Number.isFinite(at)) return true;
  return now - at > SYNTHESIS_ORPHAN_MS;
}

function stringList(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim() !== "");
}

export function recommendationsForInsert(recs: RecommendationDraft[]): RecommendationInsert[] {
  const rows: RecommendationInsert[] = [];
  for (const rec of recs) {
    const routed = forceCoachRoute({
      category: typeof rec.category === "string" ? rec.category : null,
      routeTo: typeof rec.routeTo === "string" ? rec.routeTo : undefined,
      route_to: typeof rec.route_to === "string" ? rec.route_to : undefined,
    });
    const routeTo = String(routed.route_to ?? routed.routeTo ?? "learner").toLowerCase() === "coach"
      ? "coach"
      : "learner";
    const channelRaw = String(rec.channel ?? (routeTo === "coach" ? "note" : "task")).toLowerCase();
    const channel = channelRaw === "email" || channelRaw === "note" || channelRaw === "task"
      ? channelRaw
      : routeTo === "coach"
        ? "note"
        : "task";
    const title = typeof rec.title === "string" ? rec.title.trim() : "";
    const bodySource = typeof rec.body === "string" ? rec.body : rec.description;
    const body = typeof bodySource === "string" ? bodySource.trim() : "";
    if (!title || !body) continue;
    rows.push({
      source: "intake_synthesis",
      category: typeof rec.category === "string" && rec.category.trim() ? rec.category : "GENERAL",
      routeTo,
      channel,
      title,
      body,
      status: "open",
      sourceUnitIds: stringList(rec.sourceUnitIds ?? rec.sourceArticleIds),
    });
  }
  return rows;
}
