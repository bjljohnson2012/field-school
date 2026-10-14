import { audienceCut, type StoredPlacement } from "../assessments/model.ts";
import { matchKey } from "../enrichment/names.ts";
import { FORBIDDEN_PUBLIC_KEYS, safeHttps, safePhoto } from "./public.ts";
import { isShareSlug } from "./share.ts";

const LEVELS = new Set(["learning", "working", "strong", "expert"]);

export const PEER_PROFILE_KEYS = [
  "displayName",
  "photo",
  "headline",
  "bio",
  "skills",
  "projects",
  "entries",
  "placements",
] as const;

export const PEER_FORBIDDEN_KEYS = [
  ...FORBIDDEN_PUBLIC_KEYS.filter((key) => key !== "placements"),
  "answers",
  "raw",
  "contact",
  "phone",
  "email",
] as const;

export type PeerSkill = { name: string; level: string | null };
export type PeerProject = { name: string; role: string; link: string };
export type PeerEntry = {
  kind: string;
  title: string;
  organization: string;
  startedOn: string | null;
  endedOn: string | null;
};
export type PeerPlacement = {
  track: string;
  label: string;
  categoryLabel: string;
  confidencePct: number;
  state: "locked" | "unsettled";
};

export type PeerProfile = {
  displayName: string;
  photo: string;
  headline: string;
  bio: string;
  skills: PeerSkill[];
  projects: PeerProject[];
  entries: PeerEntry[];
  placements: PeerPlacement[];
};

export type PeerPlacementInput = {
  track: string;
  taxonomy: string;
  category: string;
  label: string;
  categoryLabel: string;
  confidencePct: number;
  locked: boolean;
  unsettled: boolean;
};

function clip(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

function isTrack(value: string): value is StoredPlacement["track"] {
  return value === "personality" || value === "skills" || value === "profile";
}

/** AssessmentResults rule: locked at 75% or higher, or an unsettled best read. */
export function shownPlacements(audience: "self" | "peer" | "public", rows: readonly PeerPlacementInput[]): PeerPlacement[] {
  const stored: StoredPlacement[] = [];
  for (const row of rows) {
    if (!isTrack(row.track)) continue;
    stored.push({
      track: row.track,
      taxonomy: row.taxonomy,
      category: row.category,
      confidencePct: row.confidencePct,
      locked: row.locked,
      unsettled: row.unsettled,
    });
  }
  const allowed = new Set(audienceCut(audience, stored).map((row) => `${row.track}|${row.taxonomy}|${row.category}`));
  const out: PeerPlacement[] = [];
  for (const row of rows) {
    if (!allowed.has(`${row.track}|${row.taxonomy}|${row.category}`)) continue;
    const state = row.unsettled ? "unsettled" : row.locked ? "locked" : "open";
    if (!(state === "unsettled" || (state === "locked" && row.confidencePct >= 75))) continue;
    out.push({
      track: row.track,
      label: clip(row.label, 80),
      categoryLabel: clip(row.categoryLabel, 80),
      confidencePct: row.confidencePct,
      state,
    });
  }
  return out;
}

function peerEntries(
  entries: readonly PeerEntry[],
  projects: readonly { name: string }[],
): PeerEntry[] {
  const projectKeys = new Set(projects.map((project) => matchKey(project.name)));
  const out: PeerEntry[] = [];
  for (const entry of entries) {
    if (entry.kind !== "experience" && entry.kind !== "education" && entry.kind !== "certification" && entry.kind !== "headline") {
      continue;
    }
    const name = entry.organization.trim() || entry.title;
    if (entry.kind === "experience" && projectKeys.has(matchKey(name))) continue;
    out.push({
      kind: entry.kind,
      title: clip(entry.title, 200),
      organization: clip(entry.organization, 200),
      startedOn: entry.startedOn,
      endedOn: entry.endedOn,
    });
    if (out.length >= 40) break;
  }
  return out;
}

export function buildPeerProfile(input: {
  kind: string;
  sameOrg: boolean;
  viewerAdult: boolean;
  displayName: string;
  photo: string;
  headline: string;
  bio: string;
  skills: readonly { name: string; level: string | null }[];
  projects: readonly { name: string; role: string; link: string }[];
  entries: readonly PeerEntry[];
  placements: readonly PeerPlacementInput[];
}): PeerProfile | null {
  if (input.kind === "child" || !input.sameOrg || !input.viewerAdult) return null;
  const skills: PeerSkill[] = [];
  const seenSkills = new Set<string>();
  for (const skill of input.skills) {
    const name = clip(skill.name, 80);
    const key = name.toLowerCase();
    if (!name || seenSkills.has(key)) continue;
    seenSkills.add(key);
    const level = skill.level && LEVELS.has(skill.level) ? skill.level : null;
    skills.push({ name, level });
    if (skills.length >= 24) break;
  }
  const projects: PeerProject[] = [];
  const seenProjects = new Set<string>();
  for (const project of input.projects) {
    const name = clip(project.name, 120);
    const key = name.toLowerCase();
    if (!name || seenProjects.has(key)) continue;
    seenProjects.add(key);
    projects.push({ name, role: clip(project.role, 120), link: safeHttps(project.link) });
    if (projects.length >= 24) break;
  }
  return {
    displayName: clip(input.displayName, 80),
    photo: safePhoto(input.photo),
    headline: clip(input.headline, 200),
    bio: clip(input.bio, 1000),
    skills,
    projects,
    entries: peerEntries(input.entries, projects),
    placements: shownPlacements("peer", input.placements),
  };
}

export function profileUrls(input: {
  kind: string;
  sameOrg: boolean;
  viewerAdult: boolean;
  shareEnabled: boolean;
  slug: string | null;
  membershipId: string;
}): { publicUrl: string | null; peerUrl: string | null } {
  if (input.kind === "child") return { publicUrl: null, peerUrl: null };
  const slug = input.slug ?? "";
  const publicUrl =
    input.shareEnabled && isShareSlug(slug) && slug !== input.membershipId ? `/share/${slug}` : null;
  const peerUrl = input.sameOrg && input.viewerAdult ? `/people/${input.membershipId}` : null;
  return { publicUrl, peerUrl };
}

export function peerForbiddenKeys(value: unknown, found = new Set<string>()): string[] {
  if (!value || typeof value !== "object") return [...found];
  if (Array.isArray(value)) {
    for (const item of value) peerForbiddenKeys(item, found);
    return [...found];
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if ((PEER_FORBIDDEN_KEYS as readonly string[]).includes(key)) found.add(key);
    peerForbiddenKeys(record[key], found);
  }
  return [...found];
}

/** An adult in the same org may see another adult's profile photo. A child photo is never served. */
export function photoVisibleTo(input: { viewerKind: string; ownerKind: string; sameOrg: boolean; isOwner: boolean }) {
  if (input.viewerKind === "child" || input.ownerKind === "child") return false;
  if (input.isOwner) return true;
  return input.sameOrg;
}
