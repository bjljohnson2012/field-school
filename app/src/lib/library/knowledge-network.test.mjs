import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { clipLabel, layoutRepository } from "./knowledge-network.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function piece(id, title, extra = {}) {
  return {
    id,
    title,
    excerpt: "A stored line of knowledge.",
    href: `/o/household/teach/${id}`,
    generated: false,
    sourceKind: "text",
    units: [],
    ...extra,
  };
}

test("the map puts this org in the middle and rings the knowledge around it", () => {
  const map = layoutRepository(
    {
      orgName: "Household",
      orgSlug: "household",
      pieces: [piece("a", "Wait for the answer"), piece("b", "Call notes"), piece("c", "Pricing")],
    },
    null,
  );
  const org = map.nodes.find((node) => node.kind === "org");
  assert.equal(org.x, 50);
  assert.equal(org.y, 48);
  assert.equal(org.label, "Household");
  const lessons = map.nodes.filter((node) => node.kind === "lesson");
  assert.equal(lessons.length, 3);
  assert.equal(map.nodes.some((node) => node.kind === "unit"), false);
  assert.ok(lessons[0].y < org.y);
  assert.equal(lessons[0].x, 50);
  assert.deepEqual(
    map.edges.map((edge) => edge.to),
    lessons.map((node) => node.id),
  );
});

test("opening a piece shows only that piece's units", () => {
  const map = layoutRepository(
    {
      orgName: "Sales",
      orgSlug: "sales",
      pieces: [
        piece("a", "Wait for the answer before you pitch the whole offer out loud", {
          generated: true,
          units: [
            { id: "u1", title: "Pause", excerpt: "Stop talking.", quizCount: 1 },
            { id: "u2", title: "Ask", excerpt: "Ask one question.", quizCount: 0 },
          ],
        }),
        piece("b", "Other", {
          units: [{ id: "u3", title: "Hidden", excerpt: "Not this piece.", quizCount: 0 }],
        }),
      ],
    },
    "a",
  );
  const units = map.nodes.filter((node) => node.kind === "unit");
  assert.deepEqual(units.map((node) => node.title), ["Pause", "Ask"]);
  assert.equal(units[0].generated, true);
  assert.equal(units[1].generated, false);
  assert.equal(map.edges.filter((edge) => edge.from === "lesson:a").length, 2);
  assert.equal(map.edges.some((edge) => edge.to === "unit:u3"), false);
  assert.ok(units.every((node) => node.pieceId === "a"));
});

test("a long title is clipped and the map keeps the first 18 pieces", () => {
  assert.equal(clipLabel("  hello   there  "), "hello there");
  assert.equal(clipLabel(""), "Untitled");
  const long = "Wait for the answer before you pitch the whole offer out loud";
  assert.equal(clipLabel(long).endsWith("…"), true);
  assert.equal(clipLabel(long).length, 42);
  const pieces = Array.from({ length: 20 }, (_, index) => piece(`p${index}`, `Piece ${index}`));
  const map = layoutRepository({ orgName: "Household", orgSlug: "household", pieces }, null);
  assert.equal(map.shownLessons, 18);
  assert.equal(map.hiddenLessons, 2);
  assert.equal(map.nodes.filter((node) => node.kind === "lesson").length, 18);
});

test("Networks is the knowledge repository for this org", () => {
  const page = read("src/app/networks/page.tsx");
  const board = read("src/app/networks/network-board.tsx");
  const insights = read("src/app/insights/page.tsx");
  assert.match(page, /eyebrow="Networks"/);
  assert.match(page, /title="Knowledge repository"/);
  assert.match(page, /child_has_no_login/);
  assert.match(page, /sign_in_required/);
  assert.match(board, /data-knowledge-repository=""/);
  assert.match(board, /Nothing is stored for this org yet/);
  assert.match(insights, /href="\/networks"/);
  assert.doesNotMatch(page + board, /Lesson name|Tracked child|JTBD|Jobs-to-be-Done/);
  assert.doesNotMatch(page + board, /brand-navy|brand-orange|brand-indigo/);
});
