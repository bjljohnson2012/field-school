import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { dirname, join } from "node:path";
import { coachingNav } from "../src/lib/coaching/nav.ts";
import { requireCoachingWrite } from "../src/lib/coaching/writes.ts";
import { readOrgLogoUrl } from "../src/components/org-logo.ts";
import {
  defaultVisibilityForRepo,
  learnerCanReadUnit,
  persistVisibility,
} from "../src/app/api/coaching/knowledge/visibility.ts";
import { storedFilePath, subjectFromStoragePath, uploadDirectory } from "../src/app/api/coaching/files/paths.ts";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const AE = ["AE_ONLY", "DIRECTOR_ONLY", "BOTH"];

test("visibility map stores learner, coach, or both", () => {
  assert.equal(persistVisibility("AE_ONLY"), "learner");
  assert.equal(persistVisibility("ae_only"), "learner");
  assert.equal(persistVisibility("DIRECTOR_ONLY"), "coach");
  assert.equal(persistVisibility("BOTH"), "both");
  assert.equal(persistVisibility("learner"), "learner");
  assert.equal(persistVisibility("coach"), "coach");
  assert.equal(persistVisibility("both"), "both");
  assert.equal(persistVisibility("", "PERSONALITY"), "coach");
  assert.equal(persistVisibility(undefined, "LEADERSHIP"), "coach");
  assert.equal(persistVisibility("", "personality"), "coach");
  assert.equal(persistVisibility("", "PRODUCT"), null);
  assert.equal(defaultVisibilityForRepo("PERSONALITY"), "coach");
  assert.equal(defaultVisibilityForRepo("LEADERSHIP"), "coach");
  assert.equal(defaultVisibilityForRepo("PRODUCT"), "both");
  for (const value of ["AE_ONLY", "DIRECTOR_ONLY", "BOTH", "", "nope", "learner"]) {
    const stored = persistVisibility(value, "PERSONALITY");
    assert.equal(AE.includes(stored), false);
  }
});

test("learner filter keeps approved learner or both units", () => {
  assert.equal(learnerCanReadUnit({ status: "approved", visibility: "learner" }), true);
  assert.equal(learnerCanReadUnit({ status: "approved", visibility: "both" }), true);
  assert.equal(learnerCanReadUnit({ status: "approved", visibility: "coach" }), false);
  assert.equal(learnerCanReadUnit({ status: "pending", visibility: "learner" }), false);
  assert.equal(learnerCanReadUnit({ status: "rejected", visibility: "both" }), false);
  const page = read("src/app/knowledge/page.tsx");
  assert.match(page, /learnerCanReadUnit/);
  assert.match(page, /redirect\("\/login\?next=\/knowledge"\)/);
  assert.match(page, /className="h-page"/);
  assert.match(page, /className="card/);
});

test("READY enables knowledge, products, files, and learner knowledge", () => {
  const nav = read("src/lib/coaching/nav.ts");
  const ready = nav.slice(nav.indexOf("const READY"), nav.indexOf("function item"));
  for (const href of ["/coaching/knowledge", "/coaching/products", "/coaching/files", "/knowledge"]) {
    assert.match(ready, new RegExp(`"${href.replaceAll("/", "\\/")}"`));
  }
  const coach = coachingNav({ orgKind: "sales", capabilities: ["coach"], platformAdmin: false });
  for (const href of ["/coaching/knowledge", "/coaching/products", "/coaching/files"]) {
    assert.equal(coach.find((item) => item.href === href)?.disabled, false, href);
  }
  const learner = coachingNav({ orgKind: "sales", capabilities: ["learner"], platformAdmin: false });
  assert.equal(learner.find((item) => item.href === "/knowledge")?.disabled, false);
  assert.equal(learner.some((item) => item.href === "/coaching/files"), false);
});

test("Files tab links to the coaching files subject query", () => {
  const person = read("src/app/people/[membershipId]/page.tsx");
  assert.match(person, /href=\{`\/coaching\/files\?subject=\$\{subject\.membershipId\}`\}/);
  assert.doesNotMatch(person, /people\/\$\{subject\.membershipId\}\/files/);
});

test("requireCoachingWrite is 403 writes_disabled and mutates call it first", async () => {
  const previous = process.env.COACHING_WRITES;
  delete process.env.COACHING_WRITES;
  try {
    const unset = requireCoachingWrite();
    assert.equal(unset.status, 403);
    assert.deepEqual(await unset.json(), { error: "writes_disabled" });
    process.env.COACHING_WRITES = "0";
    const zero = requireCoachingWrite();
    assert.equal(zero.status, 403);
    assert.deepEqual(await zero.json(), { error: "writes_disabled" });
    process.env.COACHING_WRITES = "1";
    assert.equal(requireCoachingWrite(), null);
  } finally {
    if (previous === undefined) delete process.env.COACHING_WRITES;
    else process.env.COACHING_WRITES = previous;
  }

  const routes = [
    ["src/app/api/coaching/knowledge/route.ts", ["POST"]],
    ["src/app/api/coaching/knowledge/units/[id]/route.ts", ["PATCH"]],
    ["src/app/api/coaching/knowledge/from-url/route.ts", ["POST"]],
    ["src/app/api/coaching/knowledge/extract/route.ts", ["POST"]],
    ["src/app/api/coaching/knowledge/cleanup/route.ts", ["POST"]],
    ["src/app/api/coaching/products/route.ts", ["POST"]],
    ["src/app/api/coaching/products/[id]/route.ts", ["PATCH", "DELETE"]],
    ["src/app/api/coaching/products/synthesize/route.ts", ["POST"]],
    ["src/app/api/coaching/files/route.ts", ["POST"]],
    ["src/app/api/coaching/files/classify/route.ts", ["POST"]],
  ];
  for (const [rel, names] of routes) {
    const source = read(rel);
    for (const name of names) {
      const handler = source.indexOf(`export async function ${name}`);
      const gate = source.indexOf("const blocked = requireCoachingWrite()", handler);
      assert.ok(handler >= 0 && gate > handler, `${rel} ${name}`);
      const between = source.slice(handler, gate);
      assert.equal(between.includes("await "), false, rel);
      assert.equal(between.includes("getDb("), false, rel);
    }
    assert.match(source, /if \(blocked\) return blocked/);
  }
});

test("logoUrl is read from features and a blank URL stays the monogram", () => {
  assert.equal(readOrgLogoUrl(undefined), "");
  assert.equal(readOrgLogoUrl({}), "");
  assert.equal(readOrgLogoUrl({ logoUrl: "  " }), "");
  assert.equal(readOrgLogoUrl({ logoUrl: 1 }), "");
  assert.equal(readOrgLogoUrl({ logoUrl: " https://cdn.example/logo.png " }), "https://cdn.example/logo.png");
  const shell = read("src/components/app-shell.tsx");
  const chrome = read("src/components/chrome.tsx");
  assert.match(shell, /data-logo="monogram"/);
  assert.match(shell, /logoUrl/);
  assert.match(chrome, /readOrgLogoUrl\(loaded\?\.active\?\.features\)/);
  assert.equal(chrome.includes("lib/ai/client"), false);
});

test("uploads stay under the org directory and subject is recoverable", () => {
  const org = "11111111-1111-4111-8111-111111111111";
  const subject = "22222222-2222-4222-8222-222222222222";
  const full = storedFilePath(org, subject, "notes.pdf");
  assert.equal(full.startsWith(`${uploadDirectory(org)}/`), true);
  assert.equal(full.startsWith("/opt/field-school/uploads/"), true);
  assert.equal(subjectFromStoragePath(full), subject);
  const plain = storedFilePath(org, "", "notes.pdf");
  assert.equal(subjectFromStoragePath(plain), "");
});

test("knowledge, products, and files use the prompts module and not a second client", () => {
  const files = [
    "src/app/api/coaching/knowledge/route.ts",
    "src/app/api/coaching/knowledge/library.ts",
    "src/app/api/coaching/knowledge/units/[id]/route.ts",
    "src/app/api/coaching/knowledge/from-url/route.ts",
    "src/app/api/coaching/knowledge/extract/route.ts",
    "src/app/api/coaching/knowledge/cleanup/route.ts",
    "src/app/api/coaching/products/route.ts",
    "src/app/api/coaching/products/[id]/route.ts",
    "src/app/api/coaching/products/synthesize/route.ts",
    "src/app/api/coaching/products/library.ts",
    "src/app/api/coaching/files/route.ts",
    "src/app/api/coaching/files/library.ts",
    "src/app/api/coaching/files/classify/route.ts",
    "src/app/coaching/knowledge/page.tsx",
    "src/app/coaching/products/page.tsx",
    "src/app/coaching/files/page.tsx",
    "src/app/knowledge/page.tsx",
    "src/lib/ai/client.ts",
  ];
  const client = read("src/lib/ai/client.ts");
  assert.match(client, /export async function completeJson/);
  for (const rel of files) {
    if (rel.endsWith("client.ts")) continue;
    const source = read(rel);
    assert.equal(source.includes("lib/ai/client"), false, rel);
    assert.equal(source.includes('from "@/lib/ai/client"'), false, rel);
    assert.equal(source.includes("xai-"), false, rel);
  }
  const knowledge = [
    read("src/app/api/coaching/knowledge/from-url/route.ts"),
    read("src/app/api/coaching/knowledge/extract/route.ts"),
    read("src/app/api/coaching/knowledge/cleanup/route.ts"),
  ].join("\n");
  assert.match(knowledge, /articleFromUrl/);
  assert.match(knowledge, /extractArticleMetadata/);
  assert.match(knowledge, /cleanupArticleWithInstructions/);
  assert.match(knowledge, /@\/lib\/ai\/prompts\/knowledge/);
  assert.match(read("src/app/api/coaching/products/synthesize/route.ts"), /synthesizeProductBrief/);
  assert.match(read("src/app/api/coaching/files/classify/route.ts"), /classifyFile\(/);
  assert.doesNotMatch(read("src/app/api/coaching/files/route.ts"), /classifyFile\(/);
  assert.match(read("src/app/api/coaching/files/route.ts"), /confirm_required/);
  assert.match(read("src/app/api/coaching/files/route.ts"), /writeCoachingAudit/);
  assert.match(read("src/app/api/coaching/knowledge/units/[id]/route.ts"), /writeCoachingAudit/);
  assert.match(read("src/app/api/coaching/knowledge/library.ts"), /visibilityForWrite/);
  assert.match(read("src/app/api/coaching/files/library.ts"), /persistVisibility/);
  assert.match(read("src/app/api/coaching/files/paths.ts"), /\/opt\/field-school\/uploads/);
  const ui = [
    "src/app/coaching/knowledge/page.tsx",
    "src/app/coaching/knowledge/knowledge-editor.tsx",
    "src/app/coaching/products/page.tsx",
    "src/app/coaching/products/products-editor.tsx",
    "src/app/coaching/files/page.tsx",
    "src/app/coaching/files/files-panel.tsx",
  ]
    .map(read)
    .join("\n");
  assert.match(ui, /className="h-page"/);
  assert.match(ui, /className="btn-primary"/);
  assert.match(ui, /className="input/);
  assert.match(ui, /className="card/);
  assert.match(ui, /Signed in as /);
  assert.match(ui, /redirect\("\/login\?next=\/coaching\/knowledge"\)/);
  assert.match(ui, /redirect\("\/login\?next=\/coaching\/products"\)/);
  assert.match(ui, /redirect\("\/login\?next=\/coaching\/files"\)/);
  assert.match(ui, /Approve/);
  assert.match(ui, /Reject/);
});
