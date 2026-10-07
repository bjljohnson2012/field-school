import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { insightsKpis, libraryKpis, peopleKpis } from "../src/lib/desk/kpi.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("insights KPIs read the points the board already drew, and an empty org shows none", () => {
  const model = {
    empty: false,
    movement: [
      { id: "moved", value: 3 },
      { id: "stalled", value: 1 },
    ],
    nextStep: [{ id: "no-portion", value: 2 }],
    assignments: [{ id: "completed", value: 9 }],
  };
  assert.deepEqual(
    insightsKpis(model).map((kpi) => [kpi.id, kpi.value]),
    [
      ["moved", "3"],
      ["stalled", "1"],
      ["no-portion", "2"],
      ["open", "0"],
    ],
  );
  assert.deepEqual(insightsKpis({ ...model, empty: true }), []);
});

test("people KPIs count only rows on this desk", () => {
  const kpis = peopleKpis({
    rows: [{ membershipId: "a" }, { membershipId: "b" }],
    lines: [
      { membershipId: "a", confidence: "steady", nextStep: "Unit 2" },
      { membershipId: "b", confidence: " ", nextStep: "" },
      { membershipId: "other-room", confidence: "x", nextStep: "y" },
    ],
    kindLabel: "Tracked child",
  });
  assert.deepEqual(
    kpis.map((kpi) => [kpi.label, kpi.value]),
    [
      ["Tracked child", "2"],
      ["With a next step", "1"],
      ["With a note", "1"],
    ],
  );
});

test("library KPIs sum sources and count lessons a visible brain uses", () => {
  const kpis = libraryKpis({
    lessonIds: ["l1", "l2", "l3"],
    usedBy: new Map([
      ["l1", 2],
      ["l2", 0],
    ]),
    sources: new Map([
      ["l1", 1],
      ["l3", 4],
      ["not-published", 7],
    ]),
  });
  assert.deepEqual(
    kpis.map((kpi) => [kpi.id, kpi.value]),
    [
      ["published", "3"],
      ["used", "1"],
      ["sources", "5"],
    ],
  );
});

test("Insights, People, and Library share one desk frame, card, KPI strip, table, and empty line", () => {
  const desk = read("src/components/desk/desk.tsx");
  for (const part of ["DeskPage", "DeskCard", "KpiStrip", "DeskTable", "EmptyState"]) {
    assert.match(desk, new RegExp(`export function ${part}\\(`));
  }
  assert.doesNotMatch(desk, /"use client"|useState|useEffect/);
  assert.doesNotMatch(desk, /brand-navy|brand-orange|brand-indigo/);

  const insights = read("src/app/insights/page.tsx");
  const charts = read("src/app/insights/charts.tsx");
  const people = read("src/app/people/page.tsx");
  const library = read("src/app/o/[slug]/l/page.tsx");
  assert.match(insights, /eyebrow="Operator"/);
  assert.match(insights, /title="Insights"/);
  assert.match(insights, /who is moving/);
  assert.match(insights, /<DeskCard\s+data-edges="people-milestones"/);
  assert.match(charts, /<KpiStrip label="This org at a glance" items=\{insightsKpis\(model\)\} \/>/);
  assert.match(charts, /<DeskCard data-chart=\{id\} title=\{title\} hint=\{hint\}>/);
  assert.match(charts, /<DeskCard\s+data-chart="org-brain"/);
  assert.match(people, /<DeskPage\s+eyebrow="People"/);
  assert.match(people, /<DeskTable\s+caption=\{copy\.title\}/);
  assert.match(people, /peopleKpis\(\{ rows, lines, kindLabel: copy\.kind \}\)/);
  assert.match(library, /<DeskPage eyebrow=\{slug\} title="Published lessons"/);
  assert.match(library, /libraryKpis\(/);
  for (const source of [insights, charts, people, library]) {
    assert.doesNotMatch(source, /<main className=/);
  }
});
