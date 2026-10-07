/**
 * Profile and evolution collections, in the shape Payload uses:
 * a family relates to profiles, a profile relates to milestones and media.
 * A drop becomes those relations through one typed hook. It does not write
 * the sealed adult profile store.
 */

export const COLLECTIONS = [
  { slug: "families", label: "Families", hint: "The home this person belongs to." },
  { slug: "profiles", label: "Profiles", hint: "Traits of one person." },
  { slug: "milestones", label: "Milestones", hint: "The next thing they can do." },
  { slug: "media", label: "Media", hint: "Files, audio, and documents." },
] as const;

export type CollectionSlug = (typeof COLLECTIONS)[number]["slug"];

export type Trait = {
  collection: CollectionSlug;
  field: string;
  value: string;
  relatesTo?: CollectionSlug;
};

/** One drop, related across the collections. Empty text adds no profile trait. */
export function traitsFromDrop(input: {
  text?: string;
  filename?: string;
  kind?: string;
  orgName?: string;
}): Trait[] {
  const traits: Trait[] = [];
  const org = (input.orgName ?? "").trim();
  if (org) {
    traits.push({ collection: "families", field: "name", value: org });
  }
  const text = (input.text ?? "").replace(/\s+/g, " ").trim();
  const sentence = text.split(/(?<=[.!?])\s/)[0]?.trim() || "";
  if (sentence.length >= 12) {
    traits.push({
      collection: "profiles",
      field: "note",
      value: sentence.slice(0, 240),
      relatesTo: "families",
    });
    traits.push({
      collection: "milestones",
      field: "next",
      value: sentence.slice(0, 160),
      relatesTo: "profiles",
    });
  }
  const file = (input.filename ?? "").trim();
  if (file || input.kind === "file" || input.kind === "audio") {
    traits.push({
      collection: "media",
      field: "file",
      value: file || "upload",
      relatesTo: "profiles",
    });
  }
  return traits;
}
