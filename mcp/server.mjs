import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { courseSchema, courseSchemaDoc } from "./course-schema.mjs";
import {
  deleteCourse,
  getCourse,
  listCourses,
  setPublished,
  upsertCourse,
} from "./course-store.mjs";

function ok(obj) {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}

function fail(err) {
  return {
    isError: true,
    content: [
      { type: "text", text: err instanceof Error ? err.message : String(err) },
    ],
  };
}

/**
 * Build the Field School course-authoring MCP server. `sql` is an async
 * (text, params) => rows[] runner (Postgres in production, PGLite in tests).
 */
export function createCourseMcpServer(sql) {
  const server = new McpServer({
    name: "field-school-courses",
    version: "1.0.0",
  });

  server.registerTool(
    "list_courses",
    {
      title: "List courses",
      description:
        "List every course (published and draft) with slug, title, published flag, banner style, and station count.",
      inputSchema: {},
    },
    async () => {
      try {
        return ok(await listCourses(sql));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_course",
    {
      title: "Get course",
      description:
        "Fetch one full course (metadata, stations, quizzes, exam) by slug, in the standard schema.",
      inputSchema: { slug: z.string().describe("Course slug") },
    },
    async ({ slug }) => {
      try {
        const course = await getCourse(sql, slug);
        return course ? ok(course) : fail(`No course with slug '${slug}'.`);
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "get_course_schema",
    {
      title: "Get course schema",
      description:
        "Return the standard course JSON schema that upsert_course accepts. Call this first to author a valid course.",
      inputSchema: {},
    },
    async () => {
      try {
        return ok(courseSchemaDoc());
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "upsert_course",
    {
      title: "Create or update a course",
      description:
        "Create a new course or update an existing one (matched by slug) using the standard schema. Keep module slugs stable across updates to preserve student progress. Returns the slug and whether it was created.",
      inputSchema: { course: courseSchema },
    },
    async ({ course }) => {
      try {
        return ok(await upsertCourse(sql, course));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "set_course_published",
    {
      title: "Publish or unpublish a course",
      description: "Toggle a course's published state (published courses appear in the public catalog).",
      inputSchema: {
        slug: z.string(),
        published: z.boolean(),
      },
    },
    async ({ slug, published }) => {
      try {
        return ok(await setPublished(sql, slug, published));
      } catch (e) {
        return fail(e);
      }
    },
  );

  server.registerTool(
    "delete_course",
    {
      title: "Delete a course",
      description: "Permanently delete a course and its stations/exam. This does not remove student progress rows.",
      inputSchema: { slug: z.string() },
    },
    async ({ slug }) => {
      try {
        return ok(await deleteCourse(sql, slug));
      } catch (e) {
        return fail(e);
      }
    },
  );

  return server;
}
