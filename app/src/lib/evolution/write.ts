/**
 * M14 evolution v1. The note hook stays. M15 retired the campus profile table it used to update.
 * A note that contains HTML is stored empty. Milestones and media are not
 * persisted. user_profiles (the sealed adult profile store) is not written.
 * A tracked child keeps login "none". A child is not a User.
 */

import { COLLECTIONS, traitsFromDrop } from "./collections.ts";

export const EVOLUTION_PROFILE_TABLE = "living_profiles" as const;
export const SEALED_ADULT_PROFILE_STORE = "user_profiles" as const;
export const PROFILE_MAX = 2000;

export const SUBJECT_LABEL = {
  loginLearner: "Login learner",
  trackedChild: "Tracked child",
} as const;

export type SubjectLabel = (typeof SUBJECT_LABEL)[keyof typeof SUBJECT_LABEL];

/** Same test the M13 spike used: a tag blanks the note. */
const HTML_TAG = /<\/?[a-z][^>]*>/i;

export const COLLECTION_LABELS = {
  families: "Families",
  profiles: "Profiles",
  milestones: "Milestones",
  media: "Media",
} as const;

export type EvolutionSubject = {
  kind: string;
  login: string;
};

export type EvolutionDrop = {
  orgId: string;
  membershipId: string;
  text?: string;
  filename?: string;
  kind?: string;
  orgName?: string;
  subject: EvolutionSubject;
};

export type ProfileRow = {
  orgId: string;
  membershipId: string;
  kind: string;
  login: string;
  profile: string;
};

export type EvolutionStore = {
  load(orgId: string, membershipId: string): Promise<ProfileRow | null>;
  saveNote(orgId: string, membershipId: string, profile: string): Promise<void>;
};

type HookNo = { ok: false; error: "child_is_not_a_user" | "not_a_subject" };

export type EvolutionHookResult =
  | {
      ok: true;
      subject: SubjectLabel;
      note: string;
      labels: typeof COLLECTION_LABELS;
      persistMilestones: false;
      persistMedia: false;
      sealedAdultWrites: 0;
      edgeScopeColumn: false;
    }
  | HookNo;

export function evolutionWriteHook(input: {
  text?: string;
  filename?: string;
  kind?: string;
  orgName?: string;
  subject: EvolutionSubject;
}): EvolutionHookResult {
  const subject = classify(input.subject);
  if (!subject.ok) return subject;
  const text = HTML_TAG.test(input.text ?? "") ? "" : (input.text ?? "");
  const filename = HTML_TAG.test(input.filename ?? "") ? "" : (input.filename ?? "");
  const traits = traitsFromDrop({
    text,
    filename,
    kind: input.kind,
    orgName: input.orgName,
  });
  const found = traits.find((trait) => trait.collection === "profiles" && trait.field === "note")?.value ?? "";
  const note = HTML_TAG.test(found) ? "" : found;
  return {
    ok: true,
    subject: subject.label,
    note,
    labels: COLLECTION_LABELS,
    persistMilestones: false,
    persistMedia: false,
    sealedAdultWrites: 0,
    edgeScopeColumn: false,
  };
}

function classify(subject: EvolutionSubject): { ok: true; label: SubjectLabel } | HookNo {
  const kind = subject.kind.trim();
  const login = subject.login.trim();
  if (kind === "user" || kind === "User") return { ok: false, error: "child_is_not_a_user" };
  if (kind === "child") {
    if (login !== "none") return { ok: false, error: "child_is_not_a_user" };
    return { ok: true, label: SUBJECT_LABEL.trackedChild };
  }
  if (kind && login === "member") return { ok: true, label: SUBJECT_LABEL.loginLearner };
  return { ok: false, error: "not_a_subject" };
}

function sentences(profile: string) {
  return profile
    .split(/(?<=[.!?])\s+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function appendProfileNote(
  profile: string,
  note: string,
): { ok: true; profile: string; changed: boolean } | { ok: false; error: "profile_full" } {
  const clean = note.trim();
  if (!clean) return { ok: true, profile, changed: false };
  if (sentences(profile).includes(clean)) return { ok: true, profile, changed: false };
  const prior = profile.trim();
  const next = prior ? `${prior} ${clean}` : clean;
  if (next.length > PROFILE_MAX) return { ok: false, error: "profile_full" };
  return { ok: true, profile: next, changed: true };
}

export async function applyEvolutionWrite(input: EvolutionDrop, store: EvolutionStore) {
  const orgId = input.orgId.trim();
  const membershipId = input.membershipId.trim();
  if (!orgId || !membershipId) return { ok: false as const, error: "missing_scope" as const };
  const hook = evolutionWriteHook(input);
  if (!hook.ok) return hook;
  const row = await store.load(orgId, membershipId);
  if (!row) return { ok: false as const, error: "no_profile_row" as const };
  const stored = classify({ kind: row.kind, login: row.login });
  if (!stored.ok) return stored;
  const expectedKind = input.subject.kind.trim();
  const expectedLogin = input.subject.login.trim();
  if (
    stored.label !== hook.subject ||
    row.kind.trim() !== expectedKind ||
    row.login.trim() !== expectedLogin ||
    row.orgId !== orgId ||
    row.membershipId !== membershipId
  ) {
    return { ok: false as const, error: "subject_mismatch" as const };
  }
  const appended = appendProfileNote(row.profile, hook.note);
  if (!appended.ok) return appended;
  if (appended.changed) await store.saveNote(orgId, membershipId, appended.profile);
  return {
    ok: true as const,
    table: EVOLUTION_PROFILE_TABLE,
    sealedAdultStore: SEALED_ADULT_PROFILE_STORE,
    subject: hook.subject,
    labels: hook.labels,
    note: hook.note,
    profile: appended.profile,
    changed: appended.changed,
    persistedProfile: appended.changed,
    persistedMilestones: 0 as const,
    persistedMedia: 0 as const,
    persistedFamilies: 0 as const,
    sealedAdultWrites: 0 as const,
    edgeScopeColumn: false as const,
  };
}

export function labelsMatchRegistry() {
  return COLLECTIONS.every(
    (row) => COLLECTION_LABELS[row.slug as keyof typeof COLLECTION_LABELS] === row.label,
  );
}
