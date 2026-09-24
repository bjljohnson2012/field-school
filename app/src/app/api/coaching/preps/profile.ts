import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { coachingProfiles } from "@/lib/db/schema";

export function explicitProfileConfirm(value: unknown) {
  return value === true;
}

function strings(value: unknown) {
  if (!Array.isArray(value)) return null;
  return value.filter((item): item is string => typeof item === "string");
}

export async function applyConfirmedProfile(
  confirmed: boolean,
  orgId: string,
  membershipId: string,
  profile: unknown,
) {
  if (!confirmed) return null;
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return null;
  const source = profile as Record<string, unknown>;
  const patch: {
    personalitySummary?: string;
    salesStyleSummary?: string;
    communicationSummary?: string;
    leadershipSummary?: string;
    forecastingSummary?: string;
    enneagramType?: string;
    discProfile?: string;
    mbtiType?: string;
    motivations?: string[];
    strengths?: string[];
    weaknesses?: string[];
    updatedAt: Date;
  } = { updatedAt: new Date() };
  const textKeys = [
    "personalitySummary",
    "salesStyleSummary",
    "communicationSummary",
    "leadershipSummary",
    "forecastingSummary",
    "enneagramType",
    "discProfile",
    "mbtiType",
  ] as const;
  let fields = 0;
  for (const key of textKeys) {
    if (typeof source[key] === "string" && source[key].trim()) {
      patch[key] = source[key].trim();
      fields += 1;
    }
  }
  const motivations = strings(source.motivations);
  const strengths = strings(source.strengths);
  const weaknesses = strings(source.weaknesses);
  if (motivations) {
    patch.motivations = motivations;
    fields += 1;
  }
  if (strengths) {
    patch.strengths = strengths;
    fields += 1;
  }
  if (weaknesses) {
    patch.weaknesses = weaknesses;
    fields += 1;
  }
  if (!fields) return null;
  const db = getDb();
  const [saved] = await db
    .update(coachingProfiles)
    .set(patch)
    .where(and(eq(coachingProfiles.orgId, orgId), eq(coachingProfiles.membershipId, membershipId)))
    .returning({ id: coachingProfiles.id });
  return saved ?? null;
}
