export type LessonSpec = {
  id: string;
  org: string;
  title: string;
  outcome: string;
  units: { id: string; title: string; source_unit_id: string }[];
  mode: "teach" | "assign" | "video";
};

export type SourceKind = "file" | "link" | "text" | "idea";

export type Delivery = "teach" | "assign" | "both";

export type DraftUnit = {
  id: string;
  title: string;
  source_unit_id: string;
};

export type OrgPerson = {
  membershipId: string;
  name: string;
  kind: string;
  org: string;
  login: string;
};

export type PersonLabel = "Tracked child" | "Login learner";

export type DeskPerson = OrgPerson & { label: PersonLabel };

export const JOB =
  "When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.";

export function lessonMode(delivery: Delivery, videoCut: boolean): LessonSpec["mode"] {
  if (videoCut) return "video";
  if (delivery === "assign") return "assign";
  return "teach";
}

export function substanceError(kind: SourceKind, title: string, detail: string): string | null {
  if (!title.trim()) return "Name the lesson.";
  const body = detail.trim();
  if (kind === "file" && !body) return "Name the file.";
  if (kind === "link") {
    if (!body) return "Paste the link.";
    try {
      const url = new URL(body);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "Use an http or https link. This step does not pull the page.";
      }
    } catch {
      return "Use an http or https link. This step does not pull the page.";
    }
  }
  if (kind === "text" && !body) return "Paste the text.";
  if (kind === "idea" && !body) return "Say the idea.";
  return null;
}

function lineTitle(raw: string, fallback: string) {
  const line = raw.split("\n")[0]?.trim() || fallback.trim();
  if (line.length <= 80) return line;
  return line.slice(0, 80).trim();
}

export function draftUnits(input: {
  kind: SourceKind;
  title: string;
  detail: string;
  nextId: () => string;
}): DraftUnit[] {
  const title = input.title.trim();
  const detail = input.detail.replace(/\r\n/g, "\n").trim();
  const chunks =
    input.kind === "text"
      ? detail
          .split(/\n\s*\n/)
          .map((part) => part.trim())
          .filter(Boolean)
      : [input.kind === "file" ? detail : title];
  const titles = (chunks.length > 0 ? chunks : [title]).map((chunk) => lineTitle(chunk, title));
  return titles.map((unitTitle) => ({
    id: input.nextId(),
    title: unitTitle,
    source_unit_id: input.nextId(),
  }));
}

export function peopleOnDesk(
  org: string,
  people: OrgPerson[],
): { room: "household" | "team" | "held"; people: DeskPerson[] } {
  const inOrg = people.filter((person) => person.org === org);
  if (org === "household") {
    return {
      room: "household",
      people: inOrg
        .filter((person) => person.kind === "child")
        .map((person) => ({ ...person, label: "Tracked child", login: "none" })),
    };
  }
  if (org === "sales") {
    return {
      room: "team",
      people: inOrg
        .filter((person) => person.kind !== "child")
        .map((person) => ({ ...person, label: "Login learner" })),
    };
  }
  const children = inOrg.filter((person) => person.kind === "child");
  const learners = inOrg.filter((person) => person.kind !== "child");
  if (children.length > 0 && learners.length > 0) {
    return { room: "held", people: [] };
  }
  if (children.length > 0) {
    return {
      room: "household",
      people: children.map((person) => ({
        ...person,
        label: "Tracked child",
        login: "none",
      })),
    };
  }
  return {
    room: "team",
    people: learners.map((person) => ({ ...person, label: "Login learner" })),
  };
}

export function buildLessonSpec(input: {
  id: string;
  org: string;
  title: string;
  outcome: string;
  delivery: Delivery;
  videoCut: boolean;
  units: DraftUnit[];
  approvedUnitIds: readonly string[];
}): LessonSpec | null {
  const title = input.title.trim();
  const outcome = input.outcome.trim();
  const org = input.org.trim();
  if (!input.id.trim() || !org || !title || !outcome) return null;
  if (input.units.length === 0) return null;
  const approved = new Set(input.approvedUnitIds);
  if (input.units.some((unit) => !approved.has(unit.id))) return null;
  if (input.units.some((unit) => !unit.id.trim() || !unit.title.trim() || !unit.source_unit_id.trim())) {
    return null;
  }
  return {
    id: input.id,
    org,
    title,
    outcome,
    units: input.units.map((unit) => ({
      id: unit.id,
      title: unit.title.trim(),
      source_unit_id: unit.source_unit_id,
    })),
    mode: lessonMode(input.delivery, input.videoCut),
  };
}

export function formatLessonSpec(spec: LessonSpec) {
  return JSON.stringify(
    {
      id: spec.id,
      org: spec.org,
      title: spec.title,
      outcome: spec.outcome,
      units: spec.units.map((unit) => ({
        id: unit.id,
        title: unit.title,
        source_unit_id: unit.source_unit_id,
      })),
      mode: spec.mode,
    },
    null,
    2,
  );
}
