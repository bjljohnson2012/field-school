export const ENRICHMENT_COPY = {
  addProject: "Add information about a new project",
  addSkill: "Add information about a new skill",
  existing: "This is already in the system",
  use: "Use this one",
  didYouMean: "Did you mean",
  createAnyway: "No, add it as new",
  imported: "Imported from LinkedIn",
} as const;

export const SKILL_NAME_MAX = 80;
export const PROJECT_NAME_MAX = 120;

/** Display form: NFKC, trimmed, inner whitespace collapsed. Null when empty or over `max`. */
export function cleanName(raw: unknown, max: number): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.normalize("NFKC").replace(/\s+/g, " ").trim();
  return name && name.length <= max ? name : null;
}

/**
 * The comparison form every duplicate check uses. Case, spacing, punctuation, and dashes do
 * not make a new item; `+` and `#` survive so "C++" and "C#" stay distinct from "C".
 */
export function matchKey(name: string): string {
  return name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}+#]/gu, "");
}

export type Known = { id: string; name: string; matchKey: string; aliases: readonly string[] };

/** An exact match on the name or any alias. This blocks creation; the caller must link it. */
export function findExact(key: string, known: readonly Known[]): Known | null {
  if (!key) return null;
  return known.find((item) => item.matchKey === key || item.aliases.some((alias) => matchKey(alias) === key)) ?? null;
}

function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const row = [i];
    for (let j = 1; j <= b.length; j += 1) {
      row.push(Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)));
    }
    prev = row;
  }
  return prev[b.length];
}

function tokens(name: string) {
  return new Set(
    name
      .normalize("NFKC")
      .toLowerCase()
      .split(/[^\p{L}\p{N}+#]+/u)
      .filter((token) => token.length > 1),
  );
}

/**
 * Near names, best first. Advisory only: a suggestion never links anything by itself.
 * Ranked by shared words, then by edit distance on the match key.
 */
export function suggest(name: string, known: readonly Known[], limit = 3): Known[] {
  const key = matchKey(name);
  const words = tokens(name);
  const scored = known.flatMap((item) => {
    const shared = [...tokens(item.name)].filter((token) => words.has(token)).length;
    const distance = editDistance(key, item.matchKey);
    const close = distance <= Math.max(1, Math.floor(Math.max(key.length, item.matchKey.length) / 4));
    return shared > 0 || close ? [{ item, shared, distance }] : [];
  });
  scored.sort((a, b) => b.shared - a.shared || a.distance - b.distance || a.item.name.localeCompare(b.item.name));
  return scored.slice(0, limit).map((entry) => entry.item);
}
