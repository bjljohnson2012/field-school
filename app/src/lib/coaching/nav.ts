export type NavItem = {
  label: string;
  href: string;
  disabled: boolean;
};

export type CoachingNavInput = {
  orgKind: string;
  capabilities: readonly string[];
  platformAdmin: boolean;
};

const SALES_COACH_CAPS = ["coach", "leader", "admin"] as const;
const HOUSEHOLD_TEACHER_CAPS = ["teacher", "guardian", "admin"] as const;

const READY = new Set([
  "/card",
  "/roster",
  "/pattern",
  "/tasks",
  "/o/sales/welcome",
  "/o/household/welcome",
  "/coaching/questions",
  "/coaching/reviews",
  "/help",
]);

function item(label: string, href: string): NavItem {
  return { label, href, disabled: !READY.has(href) };
}

function salesLearner(): NavItem[] {
  return [
    item("My Card", "/card"),
    item("Improve", "/improve"),
    item("Knowledge", "/knowledge"),
    item("Quizzes", "/quizzes"),
    item("Course", "/o/sales/welcome"),
  ];
}

function salesCoach(): NavItem[] {
  return [
    item("Roster", "/roster"),
    item("Products", "/coaching/products"),
    item("Knowledge", "/coaching/knowledge"),
    item("Files", "/coaching/files"),
    item("Reviews", "/coaching/reviews"),
    item("Help", "/help"),
  ];
}

function householdLearner(): NavItem[] {
  return [item("Home", "/o/household/welcome"), item("Pattern", "/pattern")];
}

function householdTeacher(): NavItem[] {
  return [
    item("Home", "/roster"),
    item("Course", "/o/household/welcome"),
    item("Pattern", "/pattern"),
  ];
}

function questions(): NavItem {
  return item("Questions", "/coaching/questions");
}

function users(): NavItem {
  return item("Users", "/coaching/users");
}

function myTeam(): NavItem {
  return item("My Team", "/coaching/team");
}

function family(orgKind: string): "sales" | "household" | "other" {
  const kind = orgKind.trim().toLowerCase();
  if (kind === "sales" || kind === "company") return "sales";
  if (kind === "household" || kind === "homeschool") return "household";
  return "other";
}

function hasAny(caps: ReadonlySet<string>, names: readonly string[]) {
  return names.some((name) => caps.has(name));
}

function dedupe(items: NavItem[]): NavItem[] {
  const seen = new Set<string>();
  const out: NavItem[] = [];
  for (const entry of items) {
    if (seen.has(entry.href)) continue;
    seen.add(entry.href);
    out.push(entry);
  }
  return out;
}

/** Center nav. Tasks is not included; the orange control is the only Tasks entry. */
export function coachingNav(input: CoachingNavInput): NavItem[] {
  const caps = new Set(input.capabilities);
  const kind = family(input.orgKind);

  if (input.platformAdmin) {
    const base =
      kind === "household" ? householdTeacher() : kind === "sales" ? salesCoach() : [];
    return dedupe([...base, questions(), users()]);
  }

  if (kind === "household") {
    return hasAny(caps, HOUSEHOLD_TEACHER_CAPS) ? householdTeacher() : householdLearner();
  }

  if (kind === "sales") {
    const items = hasAny(caps, SALES_COACH_CAPS) ? salesCoach() : salesLearner();
    if (caps.has("leader")) items.push(questions(), myTeam());
    if (caps.has("admin")) items.push(users());
    return dedupe(items);
  }

  return [];
}

/** Open-task badge. Later task rows are not loaded in this pass, so the count stays 0. */
export function tasksCount(): number {
  return 0;
}
