#!/usr/bin/env node
/** Graph pick. Open many PRs. Merge only disjoint READY. Never merge HELD. */
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const NODES = [
  {id: "N1", kind: "dev", files: ["app/src/components/site-header.tsx", "app/src/app/dashboard/page.tsx"], branch: "cursor/n1-chrome", pr: 206, room: "team", done: "Leader bar Learn People Library Insights New. Sales desk zero children."},
  {id: "C2", kind: "company", files: ["docs/icp-parent.md", "docs/icp-leader.md"], branch: "cursor/c2-icp", pr: 207, room: "company-prose", done: "Both ICP files. Ethos §4 headings. Anti-job present."},
  {id: "FACTORY", kind: "dev", files: ["plates/package.json", "plates/scripts/whisperx-to-captions.mjs", "plates/AGENTS.md"], branch: "cursor/factory-slim", pr: 215, room: "company-prose", done: "@remotion/captions + whisperx mapper + four plates live catalog."},
  {id: "C1", kind: "company", files: ["docs/finance-units.md"], branch: "cursor/c1-finance", pr: 208, room: "company-prose", done: "Three prices as hours. Credits vs BYOK. What N2 charts. No live charge."},
  {id: "N2", kind: "dev", files: ["app/src/app/insights/"], branch: "cursor/n2-insights", pr: 225, room: "team", done: "Six org-scoped charts. Click to person. Honest empty."},
  {id: "C5", kind: "company", files: ["docs/gtm-hire.md"], branch: "cursor/c5-gtm", pr: 213, room: "company-prose", done: "Human hire motion parent and leader. Portal URL. No ads."},
  {id: "N3", kind: "dev", files: ["app/src/components/site-header.tsx"], branch: "cursor/n3-new-menu", pr: 214, room: "team", done: "New opens Video / Wizard / Connect AI."},
  {id: "N10", kind: "dev", files: ["app/src/app/people/"], branch: "cursor/n10-people", pr: 220, room: "team", done: "Sales = login learners. Household = tracked children. Never both."},
  {id: "N9", kind: "dev", files: ["app/src/app/dashboard/page.tsx"], branch: "cursor/n9-learn-home", pr: 217, room: "team", done: "NextCard: course, why, next. Active org only."},
  {id: "C3", kind: "company", files: ["docs/research-forces.md"], branch: "cursor/c3-research", pr: 211, room: "company-prose", done: "Four forces per room. No market count."},
  {id: "C6", kind: "company", files: ["docs/staff/STATE.md"], branch: "cursor/c6-ops", pr: null, room: "company-prose", done: "Sunday scores both rooms. Insights = N2."},
  {id: "C4", kind: "company", files: ["docs/marketing-parent-hire.md"], branch: "cursor/c4-marketing", pr: 209, room: "company-prose", done: "Five blocks. Public site unflipped."},
  {id: "N4", kind: "dev", files: ["app/src/lib/lesson-spec.ts"], branch: "cursor/n4-lesson-spec", pr: 210, room: "team", done: "One LessonSpec. Quiz items cite source_unit_id."},
  {id: "N5", kind: "dev", files: ["app/src/app/library/video/"], branch: "cursor/n5-video-in", pr: 221, room: "team", done: "Long-form video door writes draft units."},
  {id: "N6", kind: "dev", files: ["app/src/app/library/wizard/"], branch: "cursor/n6-wizard", pr: 224, room: "team", done: "Wizard door writes one LessonSpec."},
  {id: "N7", kind: "dev", files: ["app/src/app/settings/keys/"], branch: "cursor/n7-ai-keys", pr: 219, room: "team", done: "BYOK last4. Credits. Key never in GET JSON."},
  {id: "N8", kind: "dev", files: ["app/src/app/assign/"], branch: "cursor/n8-assign", pr: 223, room: "team", done: "One LessonSpec assigned in one room."},
  {id: "N11", kind: "dev", files: ["app/src/app/teach/"], branch: "cursor/n11-teach-live", pr: 212, room: "team", done: "Teach live one sales LessonSpec."},
  {id: "N12", kind: "dev", files: ["workers/extract/"], branch: "cursor/n12-extract", pr: 218, room: "team", done: "Cycle 2 FastAPI extract. HELD this week."},
  {id: "N13", kind: "dev", files: ["app/src/app/library/make-video/"], branch: "cursor/n13-make-video", pr: 222, room: "team", done: "Queue master + 9:16 from LessonSpec."},
  {id: "N14", kind: "dev", files: ["app/src/lib/brain/"], branch: "cursor/n14-brain", pr: 216, room: "team", done: "Org-scoped pgvector retrieve."},
  {id: "N15", kind: "dev", files: ["app/src/app/prove/"], branch: "cursor/n15-prove", pr: 226, room: "team", done: "Both rooms. Hirer away still moves."},
];

function statusOf(state, id) {
  const row = state.dev?.[id] || state.company?.[id];
  return row?.status || "BLOCKED";
}

function filesCollide(a, b) {
  return a.files.some((f) => b.files.includes(f) || f.startsWith(b.files.find((x) => x.endsWith("/")) || "\0") || (f.endsWith("/") && b.files.some((x) => x.startsWith(f))));
}

function headerBusy(state) {
  const inFlight = new Set(state.in_flight || []);
  return inFlight.has("N1") || statusOf(state, "N1") === "IN_FLIGHT" || statusOf(state, "N1") !== "PASS" && statusOf(state, "N1") !== "HELD";
}

function n1NotPass(state) {
  return statusOf(state, "N1") !== "PASS";
}

export function pickNext(state) {
  const inFlight = new Set(state.in_flight || []);
  const n1Open = n1NotPass(state) || inFlight.has("N1");
  const dashBusy = inFlight.has("N1") || inFlight.has("N9") || (n1NotPass(state) && !inFlight.has("N9"));
  const ready = [];
  for (const node of NODES) {
    const st = statusOf(state, node.id);
    if (st === "HELD" || st === "PASS") continue;
    if (st !== "READY") continue;
    if (inFlight.has(node.id)) continue;
    if (node.id === "N3" && n1Open) continue;
    if (node.id === "N9" && (inFlight.has("N1") || n1NotPass(state))) continue;
    ready.push(node);
  }
  const chosen = [];
  for (const node of ready) {
    if (chosen.some((c) => filesCollide(c, node))) continue;
    chosen.push(node);
  }
  return chosen;
}

export function pickOpen(state) {
  const open = [];
  for (const node of NODES) {
    const st = statusOf(state, node.id);
    if (st === "PASS" || st === "HELD") continue;
    open.push({...node, status: st, merge: st === "READY"});
  }
  return open;
}

export function formatPick(chosen, opened = []) {
  if (!chosen.length && !opened.length) {
    return {pick: [], text: "IDLE\nNo READY disjoint streams. Wait for a PASS, a human, or Cycle 2.\n"};
  }
  const ids = chosen.map((n) => n.id);
  const lines = [`MERGE ${ids.join(" ") || "none"}`];
  lines.push(`OPEN ${opened.map((n) => n.id).join(" ") || ids.join(" ")}`);
  for (const n of chosen) {
    lines.push("");
    lines.push(`id: ${n.id}`);
    lines.push(`kind: ${n.kind}`);
    lines.push(`room: ${n.room}`);
    lines.push(`branch: ${n.branch}`);
    if (n.pr) lines.push(`pr: ${n.pr}`);
    lines.push(`files: ${n.files.join(", ")}`);
    lines.push(`done: ${n.done}`);
  }
  lines.push("");
  lines.push("Paste into Field School PM:");
  lines.push(`Read docs/staff/LOOP.md. OPEN every listed PR. MERGE only ${ids.join(" and ") || "nothing"} this hour. Do not merge HELD. Do not merge N3 before N1 PASS on main. Files on a merge set must not collide. Launch stays CLOSED 0/8.`);
  return {pick: ids, text: lines.join("\n") + "\n"};
}

function main() {
  const state = JSON.parse(readFileSync(join(here, "state.json"), "utf8"));
  const chosen = pickNext(state);
  const opened = pickOpen(state);
  process.stdout.write(formatPick(chosen, opened).text);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) main();
