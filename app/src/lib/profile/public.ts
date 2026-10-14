/**
 * PM3 public profile. CDM sealed the allowlist on 2026-10-14, delegated by Ben.
 * Display name, photo, headline, bio, public skills, public projects, LinkedIn URL.
 * Email, phone, org, family, children, assessments, personality, coaching, and progress stay off.
 */

import { parseProfileUrl } from "../enrichment/linkedin.ts";
import { isShareSlug } from "./share.ts";

export const PUBLIC_PROFILE_KEYS = [
  "displayName",
  "photo",
  "headline",
  "bio",
  "skills",
  "projects",
  "linkedinUrl",
] as const;

export const FORBIDDEN_PUBLIC_KEYS = [
  "email",
  "phone",
  "org",
  "orgId",
  "orgSlug",
  "family",
  "members",
  "memberId",
  "membershipId",
  "children",
  "kids",
  "child",
  "assessments",
  "assessment",
  "personality",
  "placements",
  "coaching",
  "progress",
  "gates",
  "notes",
] as const;

export const PERSON_IN_DEVELOPMENT = "Person in development";

const MEDIA_PATH = /^\/api\/media\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HTTPS_LINK = /^https:\/\/[^\s]+$/;

export type PublicSkill = { name: string };
export type PublicProject = { name: string; link: string };

export type PublicProfile = {
  displayName: string;
  photo: string;
  headline: string;
  bio: string;
  skills: PublicSkill[];
  projects: PublicProject[];
  linkedinUrl: string;
};

export type PrivateBundle = {
  displayName: string;
  photoSrc: string;
  headline: string;
  bio: string;
  linkedinUrl: string;
  ownedSkills: readonly string[];
  publicSkills: readonly string[];
  ownedProjects: readonly PublicProject[];
  publicProjects: readonly PublicProject[];
  email?: string;
  phone?: string;
  orgId?: string;
  membershipId?: string;
  memberId?: string;
  children?: unknown;
  assessments?: unknown;
  personality?: unknown;
  coaching?: unknown;
  progress?: unknown;
  gates?: unknown;
};

function clip(value: string, max: number) {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function safePhoto(value: string) {
  const text = value.trim();
  return MEDIA_PATH.test(text) ? text : "";
}

export function safeHttps(value: string) {
  const text = value.trim();
  if (!text || text.length > 500 || !HTTPS_LINK.test(text)) return "";
  try {
    const url = new URL(text);
    return url.protocol === "https:" ? text : "";
  } catch {
    return "";
  }
}

function names(values: readonly string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const name = clip(value, 80);
    const key = name.toLowerCase();
    if (!name || seen.has(key)) continue;
    seen.add(key);
    out.push(name);
    if (out.length >= 12) break;
  }
  return out;
}

/** A public skill must already belong to this adult. */
export function chosenSkills(owned: readonly string[], marked: readonly string[]): string[] {
  const allowed = new Set(names(owned).map((name) => name.toLowerCase()));
  return names(marked).filter((name) => allowed.has(name.toLowerCase()));
}

export function chosenProjects(owned: readonly PublicProject[], marked: readonly PublicProject[]): PublicProject[] {
  const allowed = new Map(owned.map((project) => [clip(project.name, 120).toLowerCase(), project]));
  const seen = new Set<string>();
  const out: PublicProject[] = [];
  for (const project of marked) {
    const name = clip(project.name, 120);
    const key = name.toLowerCase();
    const match = allowed.get(key);
    if (!name || !match || seen.has(key)) continue;
    seen.add(key);
    out.push({ name: clip(match.name, 120), link: safeHttps(match.link) });
    if (out.length >= 12) break;
  }
  return out;
}

export function serializePublicProfile(input: PrivateBundle): PublicProfile {
  return {
    displayName: clip(input.displayName, 80),
    photo: safePhoto(input.photoSrc),
    headline: clip(input.headline, 200),
    bio: clip(input.bio, 1000),
    skills: chosenSkills(input.ownedSkills, input.publicSkills).map((name) => ({ name })),
    projects: chosenProjects(input.ownedProjects, input.publicProjects),
    linkedinUrl: parseProfileUrl(input.linkedinUrl) ?? "",
  };
}

export function forbiddenPublicKeys(value: unknown, found = new Set<string>()): string[] {
  if (!value || typeof value !== "object") return [...found];
  if (Array.isArray(value)) {
    for (const item of value) forbiddenPublicKeys(item, found);
    return [...found];
  }
  const record = value as Record<string, unknown>;
  for (const key of Object.keys(record)) {
    if ((FORBIDDEN_PUBLIC_KEYS as readonly string[]).includes(key)) found.add(key);
    forbiddenPublicKeys(record[key], found);
  }
  return [...found];
}

export type PeoplePanel =
  | { kind: "development"; label: typeof PERSON_IN_DEVELOPMENT; photo: null; shareHref: null; skills: []; projects: [] }
  | {
      kind: "adult";
      displayName: string;
      photo: string;
      skills: string[];
      projects: PublicProject[];
      shareHref: string | null;
      headline: string;
      bio: string;
    };

export function peoplePanel(input: {
  kind: string;
  displayName: string;
  photoSrc?: string;
  skills?: readonly string[];
  projects?: readonly PublicProject[];
  headline?: string;
  bio?: string;
  shareEnabled?: boolean;
  slug?: string | null;
  membershipId?: string;
}): PeoplePanel {
  if (input.kind === "child") {
    return { kind: "development", label: PERSON_IN_DEVELOPMENT, photo: null, shareHref: null, skills: [], projects: [] };
  }
  const slug = input.slug ?? "";
  const shareHref =
    input.shareEnabled && isShareSlug(slug) && slug !== input.membershipId ? `/share/${slug}` : null;
  return {
    kind: "adult",
    displayName: clip(input.displayName, 80),
    photo: safePhoto(input.photoSrc ?? ""),
    skills: names(input.skills ?? []),
    projects: chosenProjects(input.projects ?? [], input.projects ?? []),
    shareHref,
    headline: clip(input.headline ?? "", 200),
    bio: clip(input.bio ?? "", 1000),
  };
}

export type PublicFieldPatch = {
  headline: string;
  bio: string;
  linkedinUrl: string;
  publicSkills: string[];
  publicProjects: PublicProject[];
};

const PATCH_KEYS = ["headline", "bio", "linkedinUrl", "publicSkills", "publicProjects"] as const;

export function sanitizePublicPatch(
  body: unknown,
  owned: { skills: readonly string[]; projects: readonly PublicProject[] },
): { ok: true; patch: PublicFieldPatch } | { ok: false; error: string } {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "invalid_body" };
  const input = body as Record<string, unknown>;
  const extra = Object.keys(input).filter((key) => !(PATCH_KEYS as readonly string[]).includes(key));
  if (extra.length) return { ok: false, error: `field_not_public:${extra[0]}` };
  if (typeof input.headline !== "string" || typeof input.bio !== "string" || typeof input.linkedinUrl !== "string") {
    return { ok: false, error: "field_invalid" };
  }
  if (input.linkedinUrl.trim() && !parseProfileUrl(input.linkedinUrl)) return { ok: false, error: "linkedin_url_invalid" };
  if (!Array.isArray(input.publicSkills) || !input.publicSkills.every((item) => typeof item === "string")) {
    return { ok: false, error: "public_skills_invalid" };
  }
  if (!Array.isArray(input.publicProjects)) return { ok: false, error: "public_projects_invalid" };
  const markedProjects: PublicProject[] = [];
  for (const item of input.publicProjects) {
    if (!item || typeof item !== "object") return { ok: false, error: "public_projects_invalid" };
    const record = item as Record<string, unknown>;
    if (typeof record.name !== "string" || typeof record.link !== "string") return { ok: false, error: "public_projects_invalid" };
    markedProjects.push({ name: record.name, link: record.link });
  }
  return {
    ok: true,
    patch: {
      headline: clip(input.headline, 200),
      bio: clip(input.bio, 1000),
      linkedinUrl: parseProfileUrl(input.linkedinUrl) ?? "",
      publicSkills: chosenSkills(owned.skills, input.publicSkills),
      publicProjects: chosenProjects(owned.projects, markedProjects),
    },
  };
}
