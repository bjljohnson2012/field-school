import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  instrumentItems,
  instruments,
  organizations,
  skills,
} from "@/lib/db/schema";
import { HOUSEHOLD_SKILLS, SALES_SKILLS } from "@/lib/campus-runtime/lessons";
import { HOUSEHOLD_SLUG, SALES_SLUG } from "@/lib/campus-runtime/org";
import { FP50_ITEMS, INSTRUMENT_SLUG, primaryDim } from "./items";

export async function ensureInstrument() {
  const db = getDb();
  const existing = await db
    .select()
    .from(instruments)
    .where(eq(instruments.slug, INSTRUMENT_SLUG))
    .limit(1);
  let instrument = existing[0];
  if (!instrument) {
    const inserted = await db
      .insert(instruments)
      .values({
        slug: INSTRUMENT_SLUG,
        name: "Field Pattern",
        version: "v1",
      })
      .returning();
    instrument = inserted[0];
  }
  const rows = await db
    .select()
    .from(instrumentItems)
    .where(eq(instrumentItems.instrumentId, instrument.id));
  const officialFirst = FP50_ITEMS[0].prompt;
  const stale = rows.length > 0 && rows[0].prompt !== officialFirst;
  if (stale) {
    await db.delete(instrumentItems).where(eq(instrumentItems.instrumentId, instrument.id));
  }
  if (!stale && rows.length === FP50_ITEMS.length) {
    for (const item of FP50_ITEMS) {
      await db
        .update(instrumentItems)
        .set({
          childSubset: item.child,
          weights: item.weights,
          correspondence: primaryDim(item.weights),
        })
        .where(eq(instrumentItems.itemKey, item.key));
    }
  }
  if (stale || rows.length < FP50_ITEMS.length) {
    await db
      .insert(instrumentItems)
      .values(
        FP50_ITEMS.map((item) => ({
          instrumentId: instrument.id,
          itemKey: item.key,
          prompt: item.prompt,
          correspondence: primaryDim(item.weights),
          weights: item.weights,
          reverseScored: false,
          childSubset: item.child,
          sortOrder: item.n,
        })),
      )
      .onConflictDoNothing({
        target: [instrumentItems.instrumentId, instrumentItems.itemKey],
      });
  }
  return instrument;
}

function keywordsFor(prompt: string, slug: string) {
  const words = prompt
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 3)
    .slice(0, 6);
  return Array.from(new Set([slug, ...slug.split("-"), ...words]));
}

export async function ensureOrgSkills(orgId: string) {
  const db = getDb();
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.id, orgId))
    .limit(1);
  const defs =
    org?.slug === SALES_SLUG
      ? SALES_SKILLS
      : org?.slug === HOUSEHOLD_SLUG
        ? HOUSEHOLD_SKILLS
        : [];
  for (const skill of defs) {
    await db
      .insert(skills)
      .values({
        orgId,
        slug: skill.slug,
        name: skill.name,
        rubric: { prompt: skill.prompt, keywords: keywordsFor(skill.prompt, skill.slug) },
      })
      .onConflictDoNothing({ target: [skills.orgId, skills.slug] });
  }
}
