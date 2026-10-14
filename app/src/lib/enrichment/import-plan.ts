import { candidatesFromText, type ImportCandidate } from "./linkedin.ts";
import { PROJECT_NAME_MAX, cleanName, findExact, matchKey, type Known } from "./names.ts";

export type ImportOrigin = "linkedin" | "resume";

const ENTRY_KINDS = new Set(["education", "certification", "headline"]);

/** Project name is the organization when set, otherwise the title. Role is the title only when an organization is set. */
export function experienceProject(candidate: ImportCandidate): { name: string; role: string; matchKey: string } | null {
  if (candidate.kind !== "experience") return null;
  const organization = candidate.organization.trim();
  const rawName = organization || candidate.title;
  const name = cleanName(rawName.slice(0, PROJECT_NAME_MAX), PROJECT_NAME_MAX);
  if (!name) return null;
  const role = organization ? (cleanName(candidate.title.slice(0, 120), 120) ?? "") : "";
  const key = matchKey(name);
  return key ? { name, role, matchKey: key } : null;
}

export function importTarget(candidate: ImportCandidate): "skill" | "project" | "entry" | "skip" {
  if (candidate.kind === "skill") return "skill";
  if (candidate.kind === "experience") return experienceProject(candidate) ? "project" : "skip";
  if (ENTRY_KINDS.has(candidate.kind)) return "entry";
  return "skip";
}

export function entryKey(candidate: Pick<ImportCandidate, "title" | "organization">) {
  return matchKey(`${candidate.title} ${candidate.organization}`);
}

const LINKEDIN_HEADERS = new Set(["experience", "top skills", "education"]);

/** LinkedIn's Save-to-PDF layout only. Anything else is a resume proposal, not this parser. */
export function linkedInReviewList(text: string): ImportCandidate[] | null {
  const found = candidatesFromText(text);
  if (!found.some((item) => item.kind !== "headline")) return null;
  const headers = new Set(text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim().toLowerCase()));
  for (const header of LINKEDIN_HEADERS) {
    if (headers.has(header)) return proposeCertificationSkills(found);
  }
  return null;
}

/** A certification stays an entry and also offers its title as a skill the person can accept. */
export function proposeCertificationSkills(candidates: readonly ImportCandidate[]): ImportCandidate[] {
  const seen = new Set(candidates.filter((item) => item.kind === "skill").map((item) => matchKey(item.title)));
  const extra: ImportCandidate[] = [];
  for (const item of candidates) {
    if (item.kind !== "certification") continue;
    const key = matchKey(item.title);
    if (!item.title || !key || seen.has(key)) continue;
    seen.add(key);
    extra.push({
      id: `skill-cert-${extra.length}`,
      kind: "skill",
      title: item.title,
      organization: "",
      startedOn: null,
      endedOn: null,
    });
  }
  return [...candidates, ...extra];
}

export type ImportLink = { skillId: string };
export type ImportProject = { id: string; name: string; matchKey: string; role: string };
export type ImportEntry = { kind: string; matchKey: string; title: string };

export type ImportLedger = {
  catalog: Known[];
  links: ImportLink[];
  projects: ImportProject[];
  entries: ImportEntry[];
};

export function emptyLedger(): ImportLedger {
  return { catalog: [], links: [], projects: [], entries: [] };
}

export type FoldResult = {
  added: string[];
  linkedExisting: string[];
  alreadyOnProfile: string[];
};

function cloneLedger(state: ImportLedger): ImportLedger {
  return {
    catalog: state.catalog.map((item) => ({ ...item, aliases: [...item.aliases] })),
    links: state.links.map((item) => ({ ...item })),
    projects: state.projects.map((item) => ({ ...item })),
    entries: state.entries.map((item) => ({ ...item })),
  };
}

/**
 * The accept rules without a database. Education and certification never become projects.
 * A second accept of the same skill or project lands in alreadyOnProfile.
 */
export function foldImport(
  state: ImportLedger,
  items: readonly { candidate: ImportCandidate; useId: string | null }[],
): { state: ImportLedger; result: FoldResult } {
  const next = cloneLedger(state);
  const result: FoldResult = { added: [], linkedExisting: [], alreadyOnProfile: [] };
  for (const { candidate, useId } of items) {
    const target = importTarget(candidate);
    if (target === "project") {
      const project = experienceProject(candidate);
      if (!project) continue;
      if (next.projects.some((item) => item.matchKey === project.matchKey)) {
        result.alreadyOnProfile.push(candidate.title);
        continue;
      }
      next.projects.push({
        id: `project-${next.projects.length + 1}`,
        name: project.name,
        matchKey: project.matchKey,
        role: project.role,
      });
      result.added.push(candidate.title);
      continue;
    }
    if (target === "entry") {
      const key = entryKey(candidate);
      if (next.entries.some((item) => item.kind === candidate.kind && item.matchKey === key)) {
        result.alreadyOnProfile.push(candidate.title);
        continue;
      }
      next.entries.push({ kind: candidate.kind, matchKey: key, title: candidate.title });
      result.added.push(candidate.title);
      continue;
    }
    if (target !== "skill") continue;
    const key = matchKey(candidate.title);
    const exact = findExact(key, next.catalog);
    const chosen = exact ?? (useId ? next.catalog.find((item) => item.id === useId) ?? null : null);
    let skillId = chosen?.id ?? null;
    if (!skillId) {
      skillId = `skill-${next.catalog.length + 1}`;
      next.catalog.push({ id: skillId, name: candidate.title, matchKey: key, aliases: [] });
    }
    if (next.links.some((item) => item.skillId === skillId)) {
      result.alreadyOnProfile.push(chosen?.name ?? candidate.title);
      continue;
    }
    next.links.push({ skillId });
    if (chosen) result.linkedExisting.push(chosen.name);
    else result.added.push(candidate.title);
  }
  return { state: next, result };
}
