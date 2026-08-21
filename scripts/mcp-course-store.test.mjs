// Validates the MCP course store + tool wiring against the REAL migrations,
// using an in-memory PGLite as the database. Runs under `npm test`.
import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import {
  deleteCourse,
  getCourse,
  listCourses,
  setPublished,
  upsertCourse,
} from "../mcp/course-store.mjs";
import { createCourseMcpServer } from "../mcp/server.mjs";

async function freshDb() {
  const pg = new PGlite();
  await pg.waitReady;
  const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
  for (const f of files) await pg.exec(await readFile(join(dir, f), "utf8"));
  const sql = async (text, params = []) => (await pg.query(text, params)).rows;
  return { pg, sql };
}

const sampleCourse = {
  title: "Test Automation 101",
  tagline: "Ship a bot",
  videoUrl: "https://www.youtube.com/watch?v=sAoTrUijP4g",
  bannerStyle: "gradient",
  bannerColor: "#4f46e5",
  published: true,
  modules: [
    {
      title: "Name the work",
      summary: "Start here",
      bullets: ["a", "b"],
      quiz: [
        { prompt: "Pick A", choices: ["A", "B"], answer: 0, why: "because" },
      ],
    },
  ],
  examQuestions: [
    { prompt: "Final?", choices: ["yes", "no"], answer: 0, why: "" },
  ],
};

test("upsert creates a course; get/list read it back in standard shape", async () => {
  const { sql } = await freshDb();
  const res = await upsertCourse(sql, sampleCourse);
  assert.equal(res.created, true);
  assert.equal(res.slug, "test-automation-101");
  assert.equal(res.stations, 1);

  const course = await getCourse(sql, "test-automation-101");
  assert.equal(course.title, "Test Automation 101");
  assert.equal(course.bannerStyle, "gradient");
  assert.equal(course.videoId, "sAoTrUijP4g");
  assert.equal(course.modules.length, 1);
  assert.equal(course.modules[0].station, "01");
  assert.equal(course.modules[0].quiz[0].prompt, "Pick A");
  assert.equal(course.examQuestions.length, 1);

  const list = await listCourses(sql);
  assert.ok(list.find((c) => c.slug === "test-automation-101" && c.stationCount === 1));
});

test("upsert updates the same slug instead of duplicating", async () => {
  const { sql } = await freshDb();
  await upsertCourse(sql, sampleCourse);
  const res2 = await upsertCourse(sql, {
    ...sampleCourse,
    slug: "test-automation-101",
    title: "Test Automation 101 (v2)",
  });
  assert.equal(res2.created, false);
  const list = await listCourses(sql);
  assert.equal(list.filter((c) => c.slug === "test-automation-101").length, 1);
  const course = await getCourse(sql, "test-automation-101");
  assert.equal(course.title, "Test Automation 101 (v2)");
});

test("set_course_published toggles; delete removes", async () => {
  const { sql } = await freshDb();
  await upsertCourse(sql, { ...sampleCourse, published: false });
  const pub = await setPublished(sql, "test-automation-101", true);
  assert.equal(pub.published, true);
  const del = await deleteCourse(sql, "test-automation-101");
  assert.equal(del.deleted, true);
  assert.equal(await getCourse(sql, "test-automation-101"), null);
});

test("MCP tools work end-to-end over an in-memory transport", async () => {
  const { sql } = await freshDb();
  const server = createCourseMcpServer(sql);
  const client = new Client({ name: "test", version: "1.0.0" });
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverT), client.connect(clientT)]);

  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  assert.deepEqual(names, [
    "delete_course",
    "get_course",
    "get_course_schema",
    "list_courses",
    "set_course_published",
    "upsert_course",
  ]);

  const created = await client.callTool({
    name: "upsert_course",
    arguments: { course: sampleCourse },
  });
  const createdPayload = JSON.parse(created.content[0].text);
  assert.equal(createdPayload.slug, "test-automation-101");

  const got = await client.callTool({
    name: "get_course",
    arguments: { slug: "test-automation-101" },
  });
  const gotPayload = JSON.parse(got.content[0].text);
  assert.equal(gotPayload.title, "Test Automation 101");

  const missing = await client.callTool({
    name: "get_course",
    arguments: { slug: "does-not-exist" },
  });
  assert.equal(missing.isError, true);

  await client.close();
  await server.close();
});
