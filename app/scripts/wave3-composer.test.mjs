import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  SOURCE_KINDS,
  MAX_FILE_BYTES,
  MAX_ORG_BYTES,
  canSeeDrafts,
  canTeach,
  lessonVisibleTo,
  quizRequiresUnit,
} from "../src/lib/composer/rules.ts";
import { unitsFromSuppliedText } from "../src/lib/composer/units.ts";

function assertFileBudget(size, orgUsed) {
  if (size > MAX_FILE_BYTES) return "file_too_large";
  if (orgUsed + size > MAX_ORG_BYTES) return "org_quota";
  return null;
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const repo = join(root, "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");
const readRepo = (rel) => readFileSync(join(repo, rel), "utf8");

test("0005 composer tables and source kinds", () => {
  const sql = read("db/0005_composer.sql");
  for (const table of [
    "courses",
    "lessons",
    "sources",
    "knowledge_units",
    "quiz_items",
    "publish_requests",
  ]) {
    assert.match(sql, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }
  assert.match(sql, /source_unit_id uuid NOT NULL/);
  assert.deepEqual([...SOURCE_KINDS], ["text", "upload", "book", "link"]);
  assert.equal(MAX_FILE_BYTES, 200 * 1024 * 1024);
  assert.equal(MAX_ORG_BYTES, 2 * 1024 * 1024 * 1024);
});

test("real rules hide drafts from children and keep sales out of household", () => {
  const child = { kind: "child", stance: "learner", orgId: "household" };
  const parent = { kind: "adult", stance: "guardian", orgId: "household" };
  const trainer = { kind: "adult", stance: "trainer", orgId: "sales" };
  const draft = { status: "draft", orgId: "household" };
  const published = { status: "published", orgId: "household" };
  const sales = { status: "published", orgId: "sales" };
  assert.equal(canTeach(child), false);
  assert.equal(canTeach({ kind: "child", stance: "guardian" }), false);
  assert.equal(canTeach({ kind: "adult", stance: "learner" }), false);
  assert.equal(canSeeDrafts(child), false);
  assert.equal(lessonVisibleTo(draft, child), false);
  assert.equal(lessonVisibleTo(draft, parent), true);
  assert.equal(lessonVisibleTo(published, child), true);
  assert.equal(lessonVisibleTo(sales, child), false);
  assert.equal(lessonVisibleTo(published, trainer), false);
});

test("units come from supplied text and quiz needs source_unit_id", () => {
  const units = unitsFromSuppliedText("First unit.\n\nSecond unit.");
  assert.equal(units.length, 2);
  assert.equal(units[0].body, "First unit.");
  assert.equal(units[1].body, "Second unit.");
  assert.equal(quizRequiresUnit(""), false);
  assert.equal(quizRequiresUnit(undefined), false);
  assert.equal(quizRequiresUnit("unit-1"), true);
  const quiz = read("src/app/api/composer/quiz/route.ts");
  assert.match(quiz, /requireTeacher/);
  assert.match(quiz, /source_unit_id_required/);
  assert.match(quiz, /addQuizItem/);
  assert.ok(quiz.indexOf("requireTeacher") < quiz.indexOf("addQuizItem"));
  const unitsSrc = read("src/lib/composer/units.ts");
  assert.match(unitsSrc, /Never fetch a URL/);
  assert.doesNotMatch(unitsSrc, /fetch\(|https?:\/\//);
});

test("upload budget, draft files, and cross-org file 403", () => {
  assert.equal(assertFileBudget(MAX_FILE_BYTES + 1, 0), "file_too_large");
  assert.equal(assertFileBudget(1, MAX_ORG_BYTES), "org_quota");
  assert.equal(assertFileBudget(10, 0), null);
  const files = read("src/app/api/composer/files/[sourceId]/route.ts");
  assert.match(files, /requireMember/);
  assert.match(files, /cross_org/);
  assert.match(files, /canSeeDrafts/);
  assert.match(files, /unknown_file/);
  const uploads = read("src/lib/composer/uploads.ts");
  assert.match(uploads, /\/opt\/field-school\/uploads/);
});

test("composer writes stay teacher-gated and org-scoped", () => {
  const lessons = read("src/app/api/composer/lessons/route.ts");
  const sources = read("src/app/api/composer/sources/route.ts");
  const publish = read("src/app/api/composer/publish/route.ts");
  const access = read("src/lib/composer/access.ts");
  const store = read("src/lib/composer/store.ts");
  assert.match(lessons, /requireTeacher/);
  assert.match(lessons, /supplied_text_required/);
  assert.match(lessons, /canTeach/);
  assert.ok(lessons.indexOf("requireTeacher") < lessons.indexOf("createLesson"));
  assert.match(sources, /requireTeacher/);
  assert.ok(sources.indexOf("requireTeacher") < sources.indexOf("addSource"));
  assert.match(publish, /requireTeacher/);
  assert.ok(publish.indexOf("requireTeacher") < publish.indexOf("publishLesson"));
  const teacherFn = access.slice(access.indexOf("export async function requireTeacher"));
  const memberFn = access.slice(access.indexOf("export async function requireMember"));
  assert.match(teacherFn, /if \(!auth\.ok\)[\s\S]*applyComposerSqlIfConfigured/);
  assert.match(memberFn, /if \(!auth\.ok\)[\s\S]*applyComposerSqlIfConfigured/);
  assert.match(store, /eq\(lessons\.orgId, identity\.orgId\)/);
  assert.doesNotMatch(store, /body\.org_id|input\.orgId/);
});

test("teach UI exists; guest Grok Bot and locks stay", () => {
  const teach = read("src/app/o/[slug]/teach/page.tsx");
  assert.match(teach, /Teachers only/);
  assert.match(teach, /Drafts stay off the child catalog/);
  const desk = read("src/app/o/[slug]/teach/[lessonId]/page.tsx");
  assert.match(desk, /source_unit_id/);
  assert.match(desk, /canTeach === false/);
  const org = read("src/app/o/[slug]/page.tsx");
  assert.match(org, /\/o\/\$\{slug\}\/teach/);
  assert.match(org, /canTeach/);
  const header = read("src/components/site-header.tsx");
  assert.doesNotMatch(header, /composer|\/teach/);
  const children = read("src/app/children/page.tsx");
  assert.match(children, /Children/);
  assert.doesNotMatch(children, /composer|\/teach/);
  const login = read("src/app/login/page.tsx");
  assert.doesNotMatch(login, /composer/);
  const pattern = read("src/lib/pattern/items.ts");
  assert.doesNotMatch(pattern, /composer/);
  const sql = read("db/0005_composer.sql");
  assert.doesNotMatch(sql, /CREATE TABLE IF NOT EXISTS users\b|child User/);
  const grok = read("src/lib/campus-runtime/client.ts");
  assert.doesNotMatch(grok, /composer|\/teach/);
  const me = read("src/app/api/me/route.ts");
  assert.match(me, /guest: true/);
  const events = read("src/app/api/events/route.ts");
  assert.match(events, /guest: result.status === 401/);
  const deploy = read("deploy/deploy.sh");
  assert.match(deploy, /0005_composer\.sql/);
  assert.match(deploy, /! -name uploads/);
  assert.match(deploy, /chown 1001:1001/);
  const compose = read("deploy/docker-compose.yml");
  assert.match(compose, /\/opt\/field-school\/uploads:\/opt\/field-school\/uploads/);
  assert.match(compose, /COMPOSER_UPLOAD_ROOT: \/opt\/field-school\/uploads/);
  const docker = read("deploy/Dockerfile");
  assert.match(docker, /\/opt\/field-school\/uploads/);
  assert.match(docker, /^USER nextjs$/m);
  const spec = readRepo("docs/campus-runtime/CURSOR_WAVES_1_5_SPEC.md");
  assert.match(spec, /AUTH_URL stays https:\/\/university\.benjohnson\.ai/);
  const wave3 = readRepo("docs/campus-runtime/WAVE3.md");
  assert.doesNotMatch(wave3, /plates\/|Remotion Lambda|AUTH_URL flip/);
});
