export { CONTENT_COLLECTIONS } from "./content-model.ts";

export const RECORD_COLLECTIONS = [
  { slug: "families", label: "Families", owner: "wards + memberships (household)" },
  { slug: "student-profiles", label: "Student Profiles", owner: "user_profiles + kid_profiles" },
  { slug: "milestones", label: "Milestones", owner: "derived from user_profiles, tool_results, kid_profiles, progress_ledger_units" },
  { slug: "media", label: "Media", owner: "composer sources" },
] as const;

export const EVOLUTION_COLLECTIONS = [
  { slug: "families", label: "Families", hint: "The home this person belongs to." },
  { slug: "profiles", label: "Profiles", hint: "Traits of one person." },
  { slug: "milestones", label: "Milestones", hint: "The next thing they can do." },
  { slug: "media", label: "Media", hint: "Files, audio, and documents." },
] as const;
