export type Door = "learn" | "people" | "library" | "knowledge" | "insights" | "me";
export type LearnZone = "desk" | "catalog" | "collection" | "player";
export type RouteEntry = { pattern: string; door: Door | null; zone: LearnZone | null };

/** Ordered: the first match wins, so specific patterns come before their parents. `:x` is one segment, `*` the rest. */
export const ROUTES: readonly RouteEntry[] = [
  { pattern: "/learn", door: "learn", zone: "desk" },
  { pattern: "/dashboard", door: "insights", zone: null },
  { pattern: "/c/:course/desk", door: "learn", zone: "desk" },
  { pattern: "/c/:course/s/:station", door: "learn", zone: "player" },
  { pattern: "/c/:course/exam", door: "learn", zone: "player" },
  { pattern: "/c/:course/*", door: "learn", zone: "collection" },
  { pattern: "/c/:course", door: "learn", zone: "collection" },
  { pattern: "/play/*", door: "learn", zone: "player" },
  { pattern: "/o/:org/welcome", door: "learn", zone: "collection" },
  { pattern: "/o/:org/l/:lesson", door: "library", zone: "player" },
  { pattern: "/o/:org/l", door: "library", zone: "catalog" },
  { pattern: "/o/:org/teach/*", door: "library", zone: null },
  { pattern: "/o/:org/teach", door: "library", zone: null },
  { pattern: "/library/*", door: "library", zone: null },
  { pattern: "/people/*", door: "people", zone: null },
  { pattern: "/people", door: "people", zone: null },
  { pattern: "/children", door: "people", zone: null },
  { pattern: "/roster", door: "people", zone: null },
  { pattern: "/brain", door: "people", zone: null },
  { pattern: "/knowledge/goals/:id", door: "knowledge", zone: null },
  { pattern: "/knowledge/goals", door: "knowledge", zone: null },
  { pattern: "/knowledge", door: "knowledge", zone: null },
  { pattern: "/networks", door: "knowledge", zone: null },
  { pattern: "/insights", door: "insights", zone: null },
  { pattern: "/pattern", door: "me", zone: null },
  { pattern: "/skills", door: "me", zone: null },
];

function matches(pattern: string, pathname: string) {
  const want = pattern.split("/").filter(Boolean);
  const got = pathname.split("?")[0].split("/").filter(Boolean);
  for (let i = 0; i < want.length; i++) {
    if (want[i] === "*") return got.length > i;
    if (got[i] === undefined) return false;
    if (!want[i].startsWith(":") && want[i] !== got[i]) return false;
  }
  return want.length === got.length;
}

export function matchRoute(pathname: string): RouteEntry | null {
  return ROUTES.find((route) => matches(route.pattern, pathname)) ?? null;
}

export function learnZone(pathname: string): LearnZone | null {
  return matchRoute(pathname)?.zone ?? null;
}

/**
 * The door to mark as current among the doors this viewer has. A Learn surface whose own door
 * is not in the bar (a learner opening a published lesson) marks Learn instead.
 */
export function activeDoor(pathname: string, available: readonly Door[]): Door | null {
  const route = matchRoute(pathname);
  if (!route?.door) return null;
  if (available.includes(route.door)) return route.door;
  return route.zone && available.includes("learn") ? "learn" : null;
}
