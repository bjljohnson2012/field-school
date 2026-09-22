// Active org only. Sales drops tracked children. Household drops sales diagnostics.

export const EMPTY_COPY = "no events in this org yet";

export const SALES_DIAGNOSTIC_SLUGS = new Set([
  "discovery",
  "qualification",
  "next-step",
  "forecast-hygiene",
]);

export const HOUSEHOLD_SKILL_SLUGS = new Set(["morning", "chores", "read"]);

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const PORTION_CLOSED = new Set(["completed", "done", "superseded", "cancelled"]);
const UNIT_DONE = new Set(["completed", "done"]);
const ASSIGNMENT_OPEN = new Set(["open", "in_progress", "assigned", "pending"]);
const UNIT_OBJECT_TYPES = new Set(["unit", "knowledge_unit"]);

export type PersonInput = {
  membershipId: string;
  name: string;
  kind: string;
  stance: string;
};

export type EventInput = {
  membershipId: string;
  kind: string;
  objectType: string;
  objectId: string;
  createdAt: string;
  raw?: unknown;
};

export type PortionInput = {
  id: string;
  membershipId: string;
  version: number;
  status: string;
};

export type PortionItemInput = {
  portionId: string;
  membershipId: string;
  unitId: string | null;
};

export type AssignmentInput = {
  membershipId: string;
  status: string;
  objectType: string;
};

export type LedgerUnitInput = {
  membershipId: string;
  status: string;
  unitId: string | null;
};

export type SkillInput = {
  id: string;
  slug: string;
  name: string;
};

export type SkillStateInput = {
  skillId: string;
  membershipId: string;
  score: number | null;
};

export type CreditAccountInput = {
  id: string;
  mode: string;
};

export type LedgerInput = {
  creditId: string;
  direction: string;
  units: number;
  parentMembershipId: string;
  childMembershipId: string | null;
};

export type UsageInput = {
  creditId: string;
  units: number;
  parentMembershipId: string;
  childMembershipId: string | null;
};

export type UnitTitleInput = {
  id: string;
  title: string;
};

export type InsightInput = {
  orgSlug: string;
  orgName: string;
  now: string;
  people: PersonInput[];
  events: EventInput[];
  portions: PortionInput[];
  portionItems: PortionItemInput[];
  assignments: AssignmentInput[];
  ledgerUnits: LedgerUnitInput[];
  skills: SkillInput[];
  skillStates: SkillStateInput[];
  credits: CreditAccountInput[];
  ledger: LedgerInput[];
  usage: UsageInput[];
  units: UnitTitleInput[];
};

export type InsightPerson = {
  membershipId: string;
  name: string;
  kind: string;
  stance: string;
  login: "none" | "member";
};

export type InsightPoint = {
  id: string;
  label: string;
  value: number;
  valueLabel: string;
  people: InsightPerson[];
  unitId?: string;
};

export type SkillColumn = {
  id: string;
  slug: string;
  name: string;
};

export type SkillCell = {
  skillId: string;
  membershipId: string;
  score: number | null;
};

export type InsightsModel = {
  orgSlug: string;
  orgName: string;
  empty: boolean;
  childrenIncluded: number;
  salesDiagnostics: number;
  movement: InsightPoint[];
  nextStep: InsightPoint[];
  checks: InsightPoint[];
  skills: {
    columns: SkillColumn[];
    people: InsightPerson[];
    cells: SkillCell[];
  };
  credits: InsightPoint[];
  assignments: InsightPoint[];
};

function norm(value: string) {
  return value.trim().toLowerCase();
}

function dedupe(people: InsightPerson[]) {
  const map = new Map<string, InsightPerson>();
  for (const person of people) map.set(person.membershipId, person);
  return [...map.values()].sort(
    (a, b) => a.name.localeCompare(b.name) || a.membershipId.localeCompare(b.membershipId),
  );
}

function point(
  id: string,
  label: string,
  value: number,
  valueLabel: string,
  people: InsightPerson[],
  unitId?: string,
): InsightPoint {
  return { id, label, value, valueLabel, people: dedupe(people), unitId };
}

export function isSalesDiagnostic(event: { kind: string; objectId: string }) {
  return event.kind === "diagnostic" && SALES_DIAGNOSTIC_SLUGS.has(event.objectId);
}

export function courseOf(event: { objectId: string; raw?: unknown }) {
  const raw = event.raw;
  if (raw && typeof raw === "object" && "course" in raw) {
    const course = (raw as { course?: unknown }).course;
    if (typeof course === "string" && course.trim()) return course.trim();
  }
  const idx = event.objectId.indexOf(":");
  if (idx > 0) return event.objectId.slice(0, idx);
  return "";
}

export function quizPassed(raw: unknown) {
  if (!raw || typeof raw !== "object") return false;
  return (raw as { passed?: unknown }).passed === true;
}

function toPerson(row: PersonInput): InsightPerson {
  return {
    membershipId: row.membershipId,
    name: row.name,
    kind: row.kind,
    stance: row.stance,
    login: row.kind === "child" ? "none" : "member",
  };
}

function skillAllowed(orgSlug: string, slug: string) {
  if (orgSlug === "household" && SALES_DIAGNOSTIC_SLUGS.has(slug)) return false;
  if (orgSlug === "sales" && HOUSEHOLD_SKILL_SLUGS.has(slug)) return false;
  return true;
}

function eventAllowed(orgSlug: string, event: EventInput) {
  if (orgSlug === "household" && isSalesDiagnostic(event)) return false;
  const course = courseOf(event);
  if (orgSlug === "household" && course === "sales") return false;
  if (orgSlug === "sales" && course === "home") return false;
  return true;
}

function latestPortion(rows: PortionInput[], membershipId: string) {
  const mine = rows.filter((row) => row.membershipId === membershipId);
  if (!mine.length) return null;
  return mine.reduce((best, row) => (row.version >= best.version ? row : best));
}

function hasNextPortion(row: PortionInput | null) {
  if (!row) return false;
  return !PORTION_CLOSED.has(norm(row.status));
}

function hasNextUnit(
  membershipId: string,
  portions: PortionInput[],
  items: PortionItemInput[],
  assignments: AssignmentInput[],
  ledgerUnits: LedgerUnitInput[],
) {
  const latest = latestPortion(portions, membershipId);
  if (latest && hasNextPortion(latest)) {
    const linked = items.some(
      (item) => item.portionId === latest.id && item.membershipId === membershipId && item.unitId,
    );
    if (linked) return true;
  }
  const openUnit = assignments.some(
    (row) =>
      row.membershipId === membershipId &&
      UNIT_OBJECT_TYPES.has(norm(row.objectType)) &&
      ASSIGNMENT_OPEN.has(norm(row.status)),
  );
  if (openUnit) return true;
  return ledgerUnits.some(
    (row) =>
      row.membershipId === membershipId &&
      Boolean(row.unitId) &&
      !UNIT_DONE.has(norm(row.status)),
  );
}

function emptyModel(
  input: InsightInput,
  childrenIncluded: number,
  salesDiagnostics: number,
): InsightsModel {
  return {
    orgSlug: input.orgSlug,
    orgName: input.orgName,
    empty: true,
    childrenIncluded,
    salesDiagnostics,
    movement: [],
    nextStep: [],
    checks: [],
    skills: { columns: [], people: [], cells: [] },
    credits: [],
    assignments: [],
  };
}

export function buildInsights(input: InsightInput): InsightsModel {
  const people = dedupe(
    input.people
      .filter((row) => input.orgSlug !== "sales" || row.kind !== "child")
      .map(toPerson),
  );
  const byId = new Map(people.map((person) => [person.membershipId, person]));
  const visible = (membershipId: string) => byId.has(membershipId);

  const events = input.events.filter(
    (event) => visible(event.membershipId) && eventAllowed(input.orgSlug, event),
  );
  const skillById = new Map(input.skills.map((skill) => [skill.id, skill]));
  const columns = input.skills
    .filter((skill) => skillAllowed(input.orgSlug, skill.slug))
    .map((skill) => ({ id: skill.id, slug: skill.slug, name: skill.name }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  const columnIds = new Set(columns.map((column) => column.id));
  const cells: SkillCell[] = [];
  for (const state of input.skillStates) {
    if (!visible(state.membershipId) || !columnIds.has(state.skillId)) continue;
    const skill = skillById.get(state.skillId);
    if (!skill || !skillAllowed(input.orgSlug, skill.slug)) continue;
    const score = typeof state.score === "number" && Number.isFinite(state.score) ? state.score : null;
    cells.push({ skillId: state.skillId, membershipId: state.membershipId, score });
  }

  const portions = input.portions.filter((row) => visible(row.membershipId));
  const portionItems = input.portionItems.filter((row) => visible(row.membershipId));
  const assignments = input.assignments.filter((row) => visible(row.membershipId));
  const ledgerUnits = input.ledgerUnits.filter((row) => visible(row.membershipId));

  const modeByCredit = new Map(input.credits.map((row) => [row.id, norm(row.mode)]));
  let burnUnits = 0;
  let byokUnits = 0;
  const burnPeople: InsightPerson[] = [];
  const byokPeople: InsightPerson[] = [];

  function personFor(parentId: string, childId: string | null) {
    return byId.get(parentId) ?? (childId ? byId.get(childId) ?? null : null);
  }

  for (const row of input.ledger) {
    if (norm(row.direction) !== "burn") continue;
    if (modeByCredit.get(row.creditId) !== "platform") continue;
    const person = personFor(row.parentMembershipId, row.childMembershipId);
    if (!person) continue;
    if (!Number.isFinite(row.units)) continue;
    burnUnits += row.units;
    burnPeople.push(person);
  }
  for (const row of input.usage) {
    if (modeByCredit.get(row.creditId) !== "byok") continue;
    const person = personFor(row.parentMembershipId, row.childMembershipId);
    if (!person) continue;
    if (!Number.isFinite(row.units)) continue;
    byokUnits += row.units;
    byokPeople.push(person);
  }

  const salesDiagnostics =
    events.filter((event) => isSalesDiagnostic(event)).length +
    cells.filter((cell) => {
      const skill = skillById.get(cell.skillId);
      return Boolean(skill && SALES_DIAGNOSTIC_SLUGS.has(skill.slug));
    }).length;

  const childrenIncluded = people.filter((person) => person.kind === "child").length;

  const hasSignal =
    events.length > 0 ||
    cells.length > 0 ||
    assignments.length > 0 ||
    portions.length > 0 ||
    ledgerUnits.length > 0 ||
    burnUnits !== 0 ||
    byokUnits !== 0;

  if (!hasSignal) return emptyModel(input, childrenIncluded, salesDiagnostics);

  const now = Date.parse(input.now);
  const cutoff = now - SEVEN_DAYS_MS;
  const movedIds = new Set<string>();
  for (const event of events) {
    const at = Date.parse(event.createdAt);
    if (Number.isFinite(at) && at >= cutoff) movedIds.add(event.membershipId);
  }
  const moved = people.filter((person) => movedIds.has(person.membershipId));
  const stalled = people.filter((person) => !movedIds.has(person.membershipId));

  const missingPortion = people.filter(
    (person) => !hasNextPortion(latestPortion(portions, person.membershipId)),
  );
  const missingUnit = people.filter(
    (person) => !hasNextUnit(person.membershipId, portions, portionItems, assignments, ledgerUnits),
  );

  const titles = new Map(input.units.map((unit) => [unit.id, unit.title]));
  const checksByUnit = new Map<string, { passes: number; attempts: number; people: InsightPerson[] }>();
  for (const event of events) {
    if (event.kind !== "quiz") continue;
    const person = byId.get(event.membershipId);
    if (!person) continue;
    const bucket = checksByUnit.get(event.objectId) ?? { passes: 0, attempts: 0, people: [] };
    bucket.attempts += 1;
    if (quizPassed(event.raw)) bucket.passes += 1;
    bucket.people.push(person);
    checksByUnit.set(event.objectId, bucket);
  }
  const checks = [...checksByUnit.entries()]
    .filter(([, bucket]) => bucket.attempts > 0)
    .map(([unitId, bucket]) => {
      const rate = Math.round((bucket.passes / bucket.attempts) * 100);
      const label = titles.get(unitId) || unitId;
      return point(
        `unit:${unitId}`,
        label,
        rate,
        `${bucket.passes} of ${bucket.attempts} passed`,
        bucket.people,
        unitId,
      );
    })
    .sort((a, b) => a.label.localeCompare(b.label) || (a.unitId || "").localeCompare(b.unitId || ""));

  const openRows = assignments.filter((row) => ASSIGNMENT_OPEN.has(norm(row.status)));
  const doneRows = assignments.filter((row) => UNIT_DONE.has(norm(row.status)));
  const peopleFor = (rows: { membershipId: string }[]) =>
    rows.flatMap((row) => {
      const person = byId.get(row.membershipId);
      return person ? [person] : [];
    });

  const skillPeople = dedupe(
    cells.flatMap((cell) => {
      const person = byId.get(cell.membershipId);
      return person ? [person] : [];
    }),
  );

  return {
    orgSlug: input.orgSlug,
    orgName: input.orgName,
    empty: false,
    childrenIncluded,
    salesDiagnostics,
    movement: [
      point("moved", "Moved in 7 days", moved.length, String(moved.length), moved),
      point("stalled", "Stalled", stalled.length, String(stalled.length), stalled),
    ],
    nextStep: [
      point("no-portion", "No next portion", missingPortion.length, String(missingPortion.length), missingPortion),
      point("no-unit", "No next unit", missingUnit.length, String(missingUnit.length), missingUnit),
    ],
    checks,
    skills: { columns, people: skillPeople, cells },
    credits: [
      point("burn", "Platform burn", burnUnits, `${burnUnits} units`, burnPeople),
      point("byok", "BYOK", byokUnits, `${byokUnits} units`, byokPeople),
    ],
    assignments: [
      point("open", "Open", openRows.length, String(openRows.length), peopleFor(openRows)),
      point("completed", "Completed", doneRows.length, String(doneRows.length), peopleFor(doneRows)),
    ],
  };
}
