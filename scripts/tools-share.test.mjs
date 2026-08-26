import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

const SHARE_SLUGS = ["skill", "intelligence", "quiz"];

function isShareSlug(value) {
  return typeof value === "string" && SHARE_SLUGS.includes(value);
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseAssessmentShare(value) {
  if (!isRecord(value)) return null;
  if (!isShareSlug(value.toolSlug)) return null;
  if (typeof value.title !== "string" || !value.title.trim()) return null;
  if (typeof value.summary !== "string" || !value.summary.trim()) return null;
  if (typeof value.completedAt !== "string") return null;
  if (!Array.isArray(value.lines)) return null;
  const lines = value.lines
    .filter((line) => typeof line === "string")
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return null;
  return {
    toolSlug: value.toolSlug,
    title: value.title.trim(),
    summary: value.summary.trim(),
    completedAt: value.completedAt,
    lines,
  };
}

function escapePdf(text) {
  return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildAssessmentPdf(share) {
  const stream = [
    "BT",
    "/F1 16 Tf",
    "72 720 Td",
    `(${escapePdf(share.title)}) Tj`,
    "ET",
  ].join("\n");
  return `%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream\nendobj\n%%EOF\n`;
}

test("assessment share parsing and PDF bytes", () => {
  assert.equal(parseAssessmentShare({ toolSlug: "nope", title: "A", summary: "B", completedAt: "x", lines: ["y"] }), null);
  const share = parseAssessmentShare({
    toolSlug: "skill",
    title: "Skill assessment",
    summary: "Watcher · 12/24. Name one job.",
    completedAt: "2026-08-25T00:00:00.000Z",
    lines: ["Watcher · 12/24", "Name one job."],
  });
  assert.equal(share.toolSlug, "skill");
  const pdf = buildAssessmentPdf(share);
  assert.match(pdf, /^%PDF-1.4/);
  assert.match(pdf, /Skill assessment/);
  assert.match(pdf, /%%EOF/);
});

test("assessments are free to take, export, and email", () => {
  const tools = readSrc("src/app/tools/page.tsx");
  const page = readSrc("src/app/tools/[slug]/page.tsx");
  const actions = readSrc("src/components/tool-result-actions.tsx");
  const api = readSrc("src/app/api/tools/email/route.ts");
  const pdf = readSrc("src/lib/tools/pdf.ts");
  const quiz = readSrc("src/components/quiz-panel.tsx");
  const marketing = readSrc("marketing-site/tools.html");

  assert.match(tools, /Start this assessment/);
  assert.doesNotMatch(tools, /Sign in to start/);
  assert.match(page, /See results/);
  assert.match(page, /Take it free/);
  assert.match(actions, /Export PDF/);
  assert.match(actions, /Email me/);
  assert.match(actions, /Log in to save/);
  assert.match(actions, /\/api\/tools\/email/);
  assert.match(api, /createFormSubmission/);
  assert.match(api, /saturday_note/);
  assert.match(api, /emailAssessmentResult/);
  assert.match(readSrc("src/lib/members/notify.ts"), /brandedEmailHtml/);
  assert.match(readSrc("src/lib/mail/layout.ts"), /field-school-lockup\.png/);
  assert.match(pdf, /export function buildAssessmentPdf/);
  assert.match(pdf, /application\/pdf/);
  assert.match(quiz, /shareTitle/);
  assert.match(quiz, /ToolResultActions/);
  assert.match(marketing, /portal\.fieldschool\.ai\/tools\/skill/);
  assert.doesNotMatch(marketing, /login\?next=\/tools\/skill/);
});
