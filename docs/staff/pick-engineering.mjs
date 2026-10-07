#!/usr/bin/env node
/** Current program pick. N1–N15 stay in pick-next.mjs. */
import {readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

export function loadEngineeringGraph(path = join(here, "engineering-graph.json")) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function byId(graph) {
  return new Map(graph.nodes.map((node) => [node.id, node]));
}

function satisfied(node, nodes) {
  return node.needs.every((id) => {
    const need = nodes.get(id);
    return need && (need.status === "BUILT" || need.status === "PASS");
  });
}

export function pickEngineering(graph) {
  const nodes = byId(graph);
  const ready = graph.nodes.filter((node) => node.status === "READY" && satisfied(node, nodes));
  const human = graph.nodes.filter((node) => node.status === "HUMAN" && satisfied(node, nodes));
  const blocked = graph.nodes.filter((node) => node.status === "BLOCKED" || (node.status === "READY" && !satisfied(node, nodes)));
  const held = graph.nodes.filter((node) => node.status === "HELD");
  const requires = graph.outcome.requires.map((id) => nodes.get(id));
  const done = graph.outcome.done === true && requires.every((node) => node?.status === "PASS");
  return {ready, human, blocked, held, done};
}

function goalLine(graph, goal) {
  const owners = graph.nodes.filter((node) => node.goals.includes(goal.id));
  const open = owners.filter((node) => node.status !== "BUILT" && node.status !== "PASS");
  const mark = open.length ? "open" : owners.every((node) => node.status === "PASS") ? "on main" : "built, merge held";
  return `${goal.id} ${goal.name} — ${mark}. ${goal.statement}`;
}

export function formatEngineering(graph, pick = pickEngineering(graph)) {
  const lines = [
    pick.done ? "OUTCOME done" : "OUTCOME open",
    graph.outcome.statement,
    `Launch ${graph.launch}`,
    "",
    "GOALS",
  ];
  for (const goal of graph.goals) lines.push(goalLine(graph, goal));
  lines.push("");
  lines.push(`CODE ${pick.ready.map((node) => node.id).join(" ") || "none"}`);
  lines.push(`HUMAN ${pick.human.map((node) => `${node.id} ${node.name}`).join("; ") || "none"}`);
  lines.push(`BLOCKED ${pick.blocked.map((node) => node.id).join(" ") || "none"}`);
  lines.push(`HELD ${pick.held.map((node) => node.id).join(" ") || "none"}`);
  lines.push("");
  for (const node of [...pick.ready, ...pick.human]) {
    lines.push(`${node.id} ${node.name}`);
    lines.push(`done: ${node.done}`);
    if (node.pr) lines.push(`pr: ${node.pr}`);
    if (node.sha) lines.push(`sha: ${node.sha}`);
    lines.push("");
  }
  lines.push("E4 stays with the Profile M1 owner. Launch stays CLOSED 0/8.");
  return lines.join("\n") + "\n";
}

function main() {
  process.stdout.write(formatEngineering(loadEngineeringGraph()));
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) main();
