import { writeFileSync } from "fs";
import { getPayload } from "payload";
import pg from "pg";

import config from "./payload.config.ts";
import { CONTENT_COLLECTIONS } from "../../../app/src/lib/collections/content-model.ts";
import { EVOLUTION_COLLECTIONS, RECORD_COLLECTIONS } from "../../../app/src/lib/collections/registry.ts";
import { traitsFromDrop } from "../../../app/src/lib/evolution/collections.ts";
import { GAP_LOOP_COLLECTIONS } from "../../../app/src/lib/gap-loop/collections.ts";

function relationId(value: unknown): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (value && typeof value === "object" && "id" in value) return String((value as { id: unknown }).id);
  return "";
}

const password = process.env.SPIKE_OPERATOR_PASSWORD || "";
if (!password) throw new Error("SPIKE_OPERATOR_PASSWORD missing");

const payload = await getPayload({ config });
const client = new pg.Client({ connectionString: process.env.SPIKE_DATABASE_URL });
await client.connect();
const dbName = await client.query("SELECT current_database() AS name");
if (dbName.rows[0].name !== "fs_payload_spike") throw new Error("refusing non-spike database");

const operatorsBefore = await payload.count({ collection: "operators" });
if (operatorsBefore.totalDocs === 0) {
  await payload.create({
    collection: "operators",
    data: { email: "operator@spike.invalid", password, name: "Spike Operator" },
  });
}
const operatorsAfterChild = await payload.count({ collection: "operators" });

const household = await payload.create({
  collection: "organizations",
  data: { slug: "spike-household", name: "Spike Household", kind: "family", room: "household" },
});
const team = await payload.create({
  collection: "organizations",
  data: { slug: "spike-team", name: "Spike Team", kind: "team", room: "team" },
});

const course = await payload.create({
  collection: "courses",
  data: {
    org: household.id,
    slug: "grok-bot",
    title: "Grok Bot",
    _status: "draft",
    example: false,
  },
});
const moduleDoc = await payload.create({
  collection: "modules",
  data: {
    org: household.id,
    course: course.id,
    slug: "start",
    title: "Start",
    order: 0,
    _status: "draft",
  },
});
const lesson = await payload.create({
  collection: "lessons",
  data: {
    org: household.id,
    course: course.id,
    module: moduleDoc.id,
    slug: "briefing",
    title: "Briefing",
    order: 0,
    _status: "draft",
    outcomeIds: [],
    blocks: [
      { kind: "text", text: "Grok Bot starts with a briefing." },
      {
        kind: "quiz",
        questions: [
          {
            id: "q1",
            prompt: "What is a knowledge brain?",
            choices: ["A list", "A map of what you know"],
            answer: 1,
            why: "It is the map.",
            sourceUnitId: "unit-briefing",
          },
        ],
      },
    ],
  },
});
const edited = await payload.update({
  collection: "lessons",
  id: lesson.id,
  data: {
    blocks: [
      { kind: "text", text: "Grok Bot briefing, edited in Payload." },
      {
        kind: "quiz",
        questions: [
          {
            id: "q1",
            prompt: "What is a knowledge brain?",
            choices: ["A list", "A map of what you know"],
            answer: 1,
            why: "It is the map.",
            sourceUnitId: "unit-briefing",
          },
        ],
      },
    ],
  },
});
const practice = await payload.create({
  collection: "practice",
  data: { org: household.id, lesson: lesson.id, kind: "check", order: 0, blockIndex: 1 },
});
await payload.create({
  collection: "course-versions",
  data: { org: household.id, parent: course.id, version: 1, snapshot: { slug: "grok-bot" } },
});
await payload.create({
  collection: "lesson-versions",
  data: { org: household.id, parent: lesson.id, version: 1, snapshot: { slug: "briefing" } },
});
await payload.delete({ collection: "practice", id: practice.id });

const unit = await payload.create({
  collection: "growth-units",
  data: {
    org: household.id,
    kind: "family",
    title: "Spike household",
    ownerMembershipId: "fixture-parent-membership",
  },
});
const concept = await payload.create({
  collection: "knowledge-nodes",
  data: {
    org: household.id,
    growthUnit: unit.id,
    ownerKind: "family",
    ownerMembershipId: "fixture-parent-membership",
    kind: "concept",
    label: "Briefing concept",
    body: "The briefing is the first map.",
    refTable: "lessons",
    refId: String(lesson.id),
    evidence: [{ ref_table: "lessons", ref_id: String(lesson.id) }],
    status: "active",
  },
});
const lessonNode = await payload.create({
  collection: "knowledge-nodes",
  data: {
    org: household.id,
    growthUnit: unit.id,
    ownerKind: "family",
    ownerMembershipId: "fixture-parent-membership",
    kind: "lesson",
    label: "Briefing lesson",
    refTable: "lessons",
    refId: String(lesson.id),
    evidence: [{ ref_table: "lessons", ref_id: String(lesson.id) }],
    status: "active",
  },
});
const edge = await payload.create({
  collection: "knowledge-edges",
  data: {
    org: team.id,
    growthUnit: unit.id,
    ownerKind: "team",
    ownerMembershipId: "wrong-scope",
    fromNode: concept.id,
    toNode: lessonNode.id,
    rel: "supports",
    because: "The concept supports the lesson.",
    evidence: [{ ref_table: "lessons", ref_id: String(lesson.id) }],
    weight: 1,
    status: "accepted",
    origin: "user",
  },
});
let mismatchRejected = false;
try {
  const other = await payload.create({
    collection: "knowledge-nodes",
    data: {
      org: team.id,
      growthUnit: unit.id,
      ownerKind: "team",
      ownerMembershipId: "team-membership",
      kind: "concept",
      label: "Other room",
      evidence: [{ ref_table: "organizations", ref_id: "team" }],
      status: "active",
    },
  });
  await payload.create({
    collection: "knowledge-edges",
    data: {
      org: team.id,
      growthUnit: unit.id,
      ownerKind: "team",
      ownerMembershipId: "team-membership",
      fromNode: concept.id,
      toNode: other.id,
      rel: "supports",
      because: "Cross-room edge must fail.",
      evidence: [{ ref_table: "organizations", ref_id: "team" }],
      weight: 1,
      status: "proposed",
      origin: "system",
    },
  });
} catch (error) {
  mismatchRejected = error instanceof Error && error.message.includes("edge_scope_mismatch");
}

const family = await payload.create({
  collection: "families",
  data: { name: "Spike Household", room: "household" },
});
const htmlProfile = await payload.create({
  collection: "profiles",
  data: {
    family: family.id,
    orgName: "Spike Household",
    subjectKind: "tracked-child",
    note: "<script>alert(1)</script> This sentence is long enough to be a trait.",
    dropKind: "file",
    fileName: "drawing.png",
  },
});
const learner = await payload.create({
  collection: "profiles",
  data: {
    family: family.id,
    orgName: "Spike Household",
    subjectKind: "login-learner",
    note: "The learner can explain a knowledge brain in one sentence.",
    dropKind: "text",
  },
});
const operatorsAfterProfiles = await payload.count({ collection: "operators" });
const dryRuns = await payload.find({
  collection: "trait-dry-runs",
  where: { profileId: { equals: String(learner.id) } },
  limit: 5,
});
const expected = traitsFromDrop({
  text: "The learner can explain a knowledge brain in one sentence.",
  orgName: "Spike Household",
  kind: "text",
});
const storedTraits = dryRuns.docs[0]?.traits;
const stable = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${key}:${stable(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};
const traitsMatch = stable(storedTraits) === stable(expected);
const htmlStored = htmlProfile.note === "";
const childDry = await payload.find({
  collection: "trait-dry-runs",
  where: { profileId: { equals: String(htmlProfile.id) } },
  limit: 1,
});

const labels = payload.config.collections.map((collection) => ({
  slug: collection.slug,
  singular: collection.labels && typeof collection.labels === "object" ? collection.labels.singular : collection.slug,
  plural: collection.labels && typeof collection.labels === "object" ? collection.labels.plural : collection.slug,
}));
const studentLabel = JSON.stringify(labels).toLowerCase().includes("student");
const edgeFields = payload.config.collections.find((collection) => collection.slug === "knowledge-edges");
const edgeFieldNames = (edgeFields?.fields ?? []).map((field) => ("name" in field ? field.name : ""));
const scopeColumn = edgeFieldNames.includes("scope");

const tables = await client.query(
  "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema IN ('public','payload') AND table_type = 'BASE TABLE' ORDER BY 1, 2",
);
const publicCourses = await client.query(
  "SELECT count(*)::int AS n FROM public.courses WHERE slug = 'grok-bot'",
);

const readBack = await payload.findByID({ collection: "lessons", id: lesson.id, depth: 0 });
const blocks = readBack.blocks as { kind?: string; text?: string }[];

const report = {
  database: "fs_payload_spike",
  schema: "payload",
  tablePrefix: "m13_",
  operators: operatorsAfterProfiles.totalDocs,
  operatorsUnchangedByProfiles: operatorsAfterChild.totalDocs === operatorsAfterProfiles.totalDocs,
  crud: {
    course: course.slug,
    lessonEdited: blocks[0]?.text === "Grok Bot briefing, edited in Payload.",
    quizKind: blocks[1]?.kind === "quiz",
    practiceDeleted: true,
    edgeCopiedOwner: edge.ownerKind === "family" && edge.ownerMembershipId === "fixture-parent-membership",
    edgeIgnoredCallerScope: relationId(edge.org) === String(household.id),
    crossRoomRejected: mismatchRejected,
    nodeCitation: concept.refTable === "lessons" && concept.refId === String(lesson.id),
  },
  hooks: {
    traitsMatch,
    expected,
    storedTraits,
    htmlStripped: htmlStored,
    trackedChildDryRun: childDry.docs[0]?.subjectKind ?? null,
    function: "traitsFromDrop",
  },
  naming: {
    labels,
    studentLabelPresent: studentLabel,
    recordStudentSlug: RECORD_COLLECTIONS.find((item) => item.slug === "student-profiles")?.label,
    evolutionLabels: EVOLUTION_COLLECTIONS,
  },
  mapping: {
    content: CONTENT_COLLECTIONS.map((collection) => ({
      slug: collection.slug,
      fields: collection.fields,
    })),
    gap: GAP_LOOP_COLLECTIONS.filter((collection) =>
      collection.slug === "knowledge_nodes" || collection.slug === "knowledge_edges",
    ).map((collection) => ({ slug: collection.slug, fields: collection.fields.map((field) => field.name) })),
  },
  edgeFieldNames,
  scopeColumn,
  drizzleGrokBotRows: publicCourses.rows[0].n,
  tables: tables.rows,
};

writeFileSync(new URL("../evidence/crud.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({
  lessonEdited: report.crud.lessonEdited,
  traitsMatch,
  htmlStripped: htmlStored,
  crossRoomRejected: mismatchRejected,
  studentLabelPresent: studentLabel,
  scopeColumn,
  operators: report.operators,
}, null, 2));

await client.end();
await payload.destroy();
process.exit(0);
