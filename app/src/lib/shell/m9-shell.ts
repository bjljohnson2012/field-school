/**
 * M9 shell rules. The member rail ships as SHELLS.md (Learn, Me) because LAW.md holds.
 * `issue-368` is the unshipped Learn / Library / You rail. Flip it later with
 * NEXT_PUBLIC_MEMBER_RAIL_VARIANT=issue-368. Do not treat that variant as the default.
 */

export const MEMBER_RAIL_DEFAULT = "shells" as const;

export type MemberRailVariant = "shells" | "issue-368";

export type M9Door = { id: string; label: string; href: string };

export const M9_METRICS = {
  radiusSm: 8,
  radiusMd: 12,
  radiusLg: 16,
  radiusPill: 9999,
  cardRadius: 16,
  retiredRadius: [14, 20],
  stateMotionMs: 240,
  layoutMotionMs: 300,
  easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  springs: false,
  flipTextMaxMs: 900,
  flipTextStaggerMs: 200,
  flipTextOnce: true,
  discoverHeight: 48,
  discoverCircle: 44,
  discoverIcon: 20,
  discoverFontPx: 16,
  discoverWeight: 600,
  navFontPx: 14,
  navWeight: 500,
  navRowPx: 36,
  railPx: 240,
  mobileBarPx: 56,
  inputBorder: "#8A8478",
  uiBlue: "#1E4E8C",
  cream: "#F6F3EC",
} as const;

export const HERO_C = {
  kicker: "Knowledge brains",
  h1: "The knowledge brain for families and teams who cannot be in the room every hour.",
  subhead:
    "Field School builds a knowledge brain for your family or your team, so the people you are responsible for keep learning on the days you cannot be there.",
  risk: "One course is free. No card.",
  primary: "Start free",
  primaryHref: "/signup?plan=course",
  secondary: "See pricing",
  secondaryHref: "https://fieldschool.ai/pricing",
} as const;

export const OFFER_NAMES = ["Do It Yourself", "Coaching", "Consulting"] as const;

const LEADER_STANCES = new Set(["admin", "guardian", "trainer", "teacher"]);

export function isM9Leader(stance: string) {
  return LEADER_STANCES.has(stance);
}

export function resolveMemberRail(value: string | undefined | null): MemberRailVariant {
  return value === "issue-368" ? "issue-368" : MEMBER_RAIL_DEFAULT;
}

/** SHELLS default, or the isolated 240px Learn / Library / You rail. */
export function memberDoors(variant: MemberRailVariant): readonly M9Door[] {
  if (variant === "issue-368") {
    return [
      { id: "learn", label: "Learn", href: "/learn" },
      { id: "library", label: "Library", href: "/library" },
      { id: "you", label: "You", href: "/profile" },
    ];
  }
  return [
    { id: "learn", label: "Learn", href: "/learn" },
    { id: "me", label: "Me", href: "/profile" },
  ];
}

export const LEADER_DOORS: readonly M9Door[] = [
  { id: "learn", label: "Learn", href: "/learn" },
  { id: "people", label: "People", href: "/people" },
  { id: "library", label: "Library", href: "/library" },
  { id: "insights", label: "Insights", href: "/insights" },
];

export const YOU_DOORS: readonly M9Door[] = [
  { id: "profile", label: "Profile", href: "/profile" },
  { id: "assessments", label: "Assessments", href: "/profile/assessments" },
  { id: "settings", label: "Settings", href: "/settings" },
];

export type BrainType = "family" | "team";

export type NewItem = { id: string; label: string; href: string; brains: readonly BrainType[] };

/** Connect AI is Settings > AI, not a New row. Max 6 after the brain filter. */
export const NEW_ITEMS: readonly NewItem[] = [
  { id: "lesson", label: "Lesson", href: "/library", brains: ["family", "team"] },
  { id: "course", label: "Course", href: "/library", brains: ["family", "team"] },
  { id: "page", label: "Brain page", href: "/library/brain", brains: ["family", "team"] },
  { id: "goal", label: "Goal", href: "/learn/goals", brains: ["family", "team"] },
  { id: "person", label: "Person in development", href: "/people", brains: ["family"] },
  { id: "invite", label: "Member invite", href: "/signup", brains: ["team"] },
  { id: "video", label: "Import video", href: "/library/video", brains: ["family", "team"] },
];

export function newMenu(brain: BrainType): readonly NewItem[] {
  return NEW_ITEMS.filter((item) => item.brains.includes(brain)).slice(0, 6);
}

export function brainTypeOf(org: string): BrainType | null {
  if (org === "household") return "family";
  if (org === "sales") return "team";
  return null;
}

export type MobileBar = {
  heightPx: number;
  safeArea: true;
  role: "leader" | "member";
  variant: MemberRailVariant;
  labels: readonly string[];
};

export function mobileBar(role: "leader" | "member", variant: MemberRailVariant = MEMBER_RAIL_DEFAULT): MobileBar {
  const doors = role === "leader" ? [...LEADER_DOORS, { id: "new", label: "New", href: "#new" }] : memberDoors(variant);
  return {
    heightPx: M9_METRICS.mobileBarPx,
    safeArea: true,
    role,
    variant: role === "leader" ? MEMBER_RAIL_DEFAULT : variant,
    labels: doors.map((door) => door.label),
  };
}

/** Page redirects only. `/api/coaching` stays. Exact `/coaching` is the services page. */
export function coachingRedirect(pathname: string): string | null {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  if (path === "/coaching") return "/teams/services";
  if (!path.startsWith("/coaching/")) return null;
  const rest = path.slice("/coaching/".length);
  if (!rest || rest.split("/").some((part) => part === "" || part === "." || part === "..")) return null;
  return `/teams/practice/${rest}`;
}

export const COACHING_REDIRECTS: readonly { from: string; to: string; status: 301 }[] = [
  { from: "/coaching", to: "/teams/services", status: 301 },
  { from: "/coaching/reviews", to: "/teams/practice/reviews", status: 301 },
  { from: "/coaching/compare", to: "/teams/practice/compare", status: 301 },
  { from: "/coaching/knowledge", to: "/teams/practice/knowledge", status: 301 },
  { from: "/coaching/files", to: "/teams/practice/files", status: 301 },
  { from: "/coaching/products", to: "/teams/practice/products", status: 301 },
  { from: "/coaching/questions", to: "/teams/practice/questions", status: 301 },
];

/** No per-device session rows yet. Active Sessions stays hidden. */
export function activeSessionsReady(): boolean {
  return false;
}

export function flipStaggerMs(index: number, count: number): number {
  if (count <= 1) return 0;
  const spread = M9_METRICS.flipTextStaggerMs;
  return Math.round((index / (count - 1)) * spread);
}
