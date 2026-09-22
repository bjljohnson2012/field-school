#!/usr/bin/env node
/** Pick the next two disjoint Field School streams from state.json. */
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export const NODES = [
  {id: "N1", kind: "dev", files: ["app/src/components/site-header.tsx", "app/src/app/dashboard/page.tsx"], branch: "cursor/n1-chrome", room: "team", done: "Leader bar Learn People Library Insights New. Sales desk zero children."},
  {id: "C2", kind: "company", files: ["docs/icp-parent.md", "docs/icp-leader.md"], branch: "cursor/c2-icp", room: "company-prose", done: "Both ICP files. Ethos §4 headings. Anti-job present."},
  {id: "FACTORY", kind: "dev", files: ["plates/package.json", "plates/scripts/whisperx-to-captions.mjs", "plates/AGENTS.md"], branch: "cursor/factory-slim", room: "company-prose", done: "@remotion/captions + whisperx mapper + four plates live catalog."},
  {id: "C1", kind: "company", files: ["docs/finance-units.md"], branch: "cursor/c1-finance", room: "company-prose", done: "Three prices as hours. Credits vs BYOK. What N2 charts. No live charge."},
  {id: "N2", kind: "dev", files: ["app/src/app/insights/"], branch: "cursor/n2-insights", room: "team", done: "Six org-scoped charts. Click to person. Honest empty."},
  {id: "C5", kind: "company", files: ["docs/gtm-hire.md"], branch: "cursor/c5-gtm", room: "company-prose", done: "Human hire motion parent and leader. Portal URL. No ads."},
  {id: "N3", kind: "dev", files: ["app/src/components/site-header.tsx"], branch: "cursor/n3-new", room: "team", done: "New opens Video / Wizard / Connect AI."},
  {id: "N10", kind: "dev", files: ["app/src/app/people/"], branch: "cursor/n10-people", room: "team", done: "Sales = login learners. Household = tracked children. Never both."},
  {id: "N9", kind: "dev", files: ["app/src/app/dashboard/page.tsx"], branch: "cursor/n9-learn", room: "team", done: "NextCard: course, why, next. Active org only."},
  {id: "C3", kind: "company", files: ["docs/research-forces.md"], branch: "cursor/c3-research", room: "company-prose", done: "Four forces per room. No market count."},
  {id: "C6", kind: "company", files: ["docs/staff/STATE.md"], branch: "cursor/c6-ops", room: "company-prose", done: "Sunday scores both rooms. Insights = N2."},
  {id: "C4", kind: "company", files: ["docs/marketing-parent-hire.md"], branch: "cursor/c4-marketing", room: "company-prose", done: "Five blocks. Public site unflipped."},
];

function statusOf(state, id) {
  const row = state.dev?.[id] || state.company?.[id];
  return row?.status || "BLOCKED";
}

function filesCollide(a, b) {
  return a.files.some((f) => b.files.includes(f));
}

export function pickNext(state) {
  const inFlight = new Set(state.in_flight || []);
  const headerBusy = inFlight.has("N1") || statusOf(state, "N1") === "IN_FLIGHT";
  const dashboardBusy = inFlight.has("N1") || inFlight.has("N9");
  const ready = [];
  for (const node of NODES) {
    if (statusOf(state, node.id) !== "READY") continue;
    if (inFlight.has(node.id)) continue;
    if (node.id === "N3" && headerBusy) continue;
    if (node.id === "N9" && dashboardBusy) continue;
    ready.push(node);
  }
  const chosen = [];
  for (const node of ready) {
    if (chosen.length >= 2) break;
    if (chosen.some((c) => filesCollide(c, node))) continue;
    chosen.push(node);
  }
  return chosen;
}

export function formatPick(chosen) {
  if (!chosen.length) {
    return {pick: [], text: "IDLE\nNo READY disjoint streams. Wait for a PASS, a human, or Cycle 2.\n"};
  }
  const ids = chosen.map((n) => n.id);
  const lines = [`PICK ${ids.join(" ")}`];
  for (const n of chosen) {
    lines.push("");
    lines.push(`id: ${n.id}`);
    lines.push(`kind: ${n.kind}`);
    lines.push(`room: ${n.room}`);
    lines.push(`branch: ${n.branch}`);
    lines.push(`files: ${n.files.join(", ")}`);
    lines.push(`done: ${n.done}`);
  }
  lines.push("");
  lines.push("Paste into Field School PM:");
  lines.push(`Read docs/staff/LOOP.md. Do ${ids.join(" and ")}. Files do not collide. Loop until those rows are PASS in docs/staff/state.json. Launch stays CLOSED 0/8.`);
  return {pick: ids, text: lines.join("\n") + "\n"};
}

function main() {
  const state = JSON.parse(readFileSync(join(here, "state.json"), "utf8"));
  const chosen = pickNext(state);
  process.stdout.write(formatPick(chosen).text);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) main();
