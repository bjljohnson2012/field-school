import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
  instrumentItems,
  instruments,
  skills,
} from "@/lib/db/schema";
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

export async function ensureOrgSkills(orgId: string) {
  const db = getDb();
  const defaults = [
    {
      slug: "brief",
      name: "Write the outcome",
      rubric: {
        keywords: ["outcome", "brief", "one sentence", "done"],
        correspondence: "approach",
      },
    },
    {
      slug: "ladder",
      name: "Walk a ladder",
      rubric: {
        keywords: ["ladder", "station", "quiz", "watch"],
        correspondence: "learn",
      },
    },
    {
      slug: "staff",
      name: "Name the staff",
      rubric: {
        keywords: ["staff", "team", "job", "thread"],
        correspondence: "group",
      },
    },
  ];
  for (const skill of defaults) {
    await db
      .insert(skills)
      .values({
        orgId,
        slug: skill.slug,
        name: skill.name,
        rubric: skill.rubric,
      })
      .onConflictDoNothing({ target: [skills.orgId, skills.slug] });
  }
}
