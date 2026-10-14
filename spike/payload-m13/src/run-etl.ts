import { writeFileSync } from "fs";
import pg from "pg";
import { getPayload } from "payload";

import config from "./payload.config.ts";

const source = new pg.Client({
  connectionString: "postgresql://ubuntu@/fs_payload_spike?host=/var/run/postgresql",
});
await source.connect();
const sourceName = await source.query("SELECT current_database() AS name");
if (sourceName.rows[0].name !== "fs_payload_spike") throw new Error("refusing source database");

const course = await source.query(
  `SELECT c.slug, c.title, c._status, o.slug AS org_slug
   FROM courses c JOIN organizations o ON o.id = c.org_id
   WHERE o.slug = 'household' AND c.slug = 'grok-bot'`,
);
const nodes = await source.query(
  `SELECT n.label, n.kind, n.ref_table, n.status
   FROM knowledge_nodes n JOIN organizations o ON o.id = n.org_id
   WHERE o.slug IN ('household', 'spike-team')
   ORDER BY n.label`,
);
await source.end();

const payload = await getPayload({ config });
const org = await payload.create({
  collection: "organizations",
  data: { slug: "spike-household", name: "Spike Household", kind: "family", room: "household" },
});
const copied = await payload.create({
  collection: "courses",
  data: {
    org: org.id,
    slug: course.rows[0].slug,
    title: course.rows[0].title,
    _status: course.rows[0]._status === "published" ? "published" : "draft",
    example: false,
  },
});
const found = await payload.find({ collection: "courses", where: { slug: { equals: "grok-bot" } } });
const report = {
  mode: "etl",
  source: "fs_payload_spike public.courses",
  targetDatabase: process.env.SPIKE_DATABASE_URL?.replace(/\/\/[^@]*@/, "//") ?? "",
  sourceCourse: course.rows[0] ?? null,
  sourceNodes: nodes.rows,
  copiedSlug: copied.slug,
  targetCount: found.totalDocs,
};
writeFileSync(new URL("../evidence/etl.json", import.meta.url), JSON.stringify(report, null, 2));
console.log(JSON.stringify({ copiedSlug: copied.slug, targetCount: found.totalDocs, nodes: nodes.rows.length }));
await payload.destroy();
process.exit(found.totalDocs === 1 ? 0 : 1);
