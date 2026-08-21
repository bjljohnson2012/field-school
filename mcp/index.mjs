#!/usr/bin/env node
// Stdio entry point for the Field School course-authoring MCP server.
// Connects to the app's Postgres via DATABASE_URL and exposes course tools.
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import pg from "pg";
import { createCourseMcpServer } from "./server.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !databaseUrl.trim()) {
  console.error(
    "[field-school-mcp] DATABASE_URL is required (point it at the same Postgres the app uses).",
  );
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: databaseUrl, max: 3 });
const sql = async (text, params = []) => (await pool.query(text, params)).rows;

const server = createCourseMcpServer(sql);
const transport = new StdioServerTransport();
await server.connect(transport);
console.error("[field-school-mcp] course MCP server ready on stdio.");
