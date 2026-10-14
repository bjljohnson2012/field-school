import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { parseBlocks } from "../src/lib/collections/content-model.ts";
import {
  GUEST_CONTINUITY_COPY,
  LEARNER_STEPS,
  LESSON_VIEWPORT,
  LIBRARY_SECTIONS,
  NINE_BLOCK_SLOTS,
  YAP_CUT_LESSON_ID,
  lessonsForSurface,
  libraryRedirect,
  measureLessonStep,
  moveTreeFocus,
  nineBlockTemplate,
  nineSlotError,
  publishLibraryLesson,
  readyLesson,
  rememberVersion,
  renderLessonStepHtml,
  renderSessionHtml,
  renderSurfaceHtml,
  restoreVersion,
  sessionCatalog,
  setTextSlot,
  sessionsForViewer,
} from "../src/lib/library/m10.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import {
  M9_METRICS,
  MEMBER_RAIL_DEFAULT,
  memberDoors,
  mobileBar,
  newMenu,
  resolveMemberRail,
} from "../src/lib/shell/m9-shell.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const SEALED_MENU = ["Lesson", "Course", "Brain page", "Video", "Wizard"];
const SEALED_HREFS = [
  "/library/lessons/new",
  "/library/courses/new",
  "/library/brain/new",
  "/library/video",
  "/library/wizard",
];

test("legacy library paths redirect and sealed New destinations stay", () => {
  assert.equal(libraryRedirect("/o/household/l"), "/library");
  assert.equal(libraryRedirect("/o/household/l/"), "/library");
  assert.equal(libraryRedirect("/o/sales/l/lesson-1"), "/library/lessons/lesson-1");
  assert.equal(libraryRedirect("/o/household/teach"), "/library");
  assert.equal(libraryRedirect("/o/sales/teach/lesson-1"), "/library/lessons/lesson-1/edit");
  assert.equal(libraryRedirect("/o/household/welcome"), null);
  assert.equal(libraryRedirect("/play/lesson-spine"), "/c/lesson-spine/master");
  assert.equal(libraryRedirect("/coaching/files"), "/library/media");
  assert.equal(libraryRedirect("/coaching/questions"), "/library/practice");
  assert.equal(libraryRedirect("/knowledge"), "/library/brain");
  assert.equal(libraryRedirect("/brain"), "/library/brain");
  assert.equal(libraryRedirect("/operator/publish"), "/library");
  assert.equal(libraryRedirect("/library/wizard"), null);
  assert.equal(libraryRedirect("/library/video"), null);
  const proxy = read("src/proxy.ts");
  assert.match(proxy, /libraryRedirect/);
  assert.match(proxy, /NextResponse\.redirect\(url, 301\)/);
});

test("library tree is Brain, Courses, Sessions, Media and arrows move siblings", () => {
  assert.deepEqual(
    LIBRARY_SECTIONS.map((section) => section.label),
    ["Brain", "Courses", "Sessions", "Media"],
  );
  assert.equal(moveTreeFocus(4, 0, "ArrowDown"), 1);
  assert.equal(moveTreeFocus(4, 1, "ArrowDown"), 2);
  assert.equal(moveTreeFocus(4, 2, "ArrowUp"), 1);
  assert.equal(moveTreeFocus(4, 3, "ArrowDown"), 3);
  assert.equal(moveTreeFocus(4, 2, "Home"), 0);
  assert.equal(moveTreeFocus(4, 0, "End"), 3);
  const tree = read("src/components/library/tree.tsx");
  assert.match(tree, /role="tree"/);
  assert.match(tree, /role="treeitem"/);
  assert.match(tree, /tabIndex=/);
  assert.match(tree, /moveTreeFocus/);
});

test("members miss drafts in Learn and leaders see them in Library", () => {
  const draft = nineBlockTemplate({ orgId: "org-1", id: "draft-lesson", title: "Draft lesson" });
  const published = publishLibraryLesson(readyLesson({ id: "published-lesson", orgId: "org-1", title: "Live lesson" }));
  assert.equal(published.ok, true);
  const lessons = [draft, published.lesson];
  const learn = renderSurfaceHtml(lessons, "member", "learn");
  const library = renderSurfaceHtml(lessons, "leader", "library");
  assert.doesNotMatch(learn, /draft-lesson/);
  assert.match(learn, /published-lesson/);
  assert.match(library, /draft-lesson/);
  assert.equal(lessonsForSurface(lessons, "child", "learn").length, 0);
  assert.match(read("src/components/library/published-learn-list.tsx"), /lessonsForSurface/);
  assert.match(read("src/app/api/library/learn/route.ts"), /lessonsForSurface/);
});

test("publishing an empty required block fails and stays draft", () => {
  const draft = nineBlockTemplate({ orgId: "org-1", id: "empty-lesson", title: "Empty" });
  const result = publishLibraryLesson(draft);
  assert.equal(result.ok, false);
  assert.equal(result.lesson.status, "draft");
  assert.notEqual(result.error, "");
});

test("block JSON with HTML tags is rejected", () => {
  assert.equal(parseBlocks([{ kind: "text", text: "<p>hi</p>" }]).ok, false);
  const dirty = setTextSlot(readyLesson({ id: "html", orgId: "org-1", title: "HTML" }), 0, "<em>no</em>");
  const result = publishLibraryLesson(dirty);
  assert.equal(result.ok, false);
  assert.equal(result.error, "html_not_allowed");
  assert.equal(result.lesson.status, "draft");
});

test("version restore puts the earlier published text back for a member", () => {
  const first = publishLibraryLesson(readyLesson({ id: "L1", orgId: "org-1", title: "Lesson", text: "Alpha objective" }));
  assert.equal(first.ok, true);
  let versions = rememberVersion([], first.lesson);
  const second = publishLibraryLesson(setTextSlot(first.lesson, 0, "Beta objective"));
  assert.equal(second.ok, true);
  versions = rememberVersion(versions, second.lesson);
  const restored = restoreVersion(versions, 1);
  assert.ok(restored);
  const html = renderSurfaceHtml([restored], "member", "learn");
  assert.match(html, /Alpha objective/);
  assert.doesNotMatch(html, /Beta objective/);
});

test("a new lesson inserts nine block slots in order", () => {
  const lesson = nineBlockTemplate({ orgId: "org-1", id: "nine", title: "Nine" });
  assert.equal(lesson.blocks.length, 9);
  assert.deepEqual(
    lesson.blocks.map((block) => block.kind),
    NINE_BLOCK_SLOTS.map((slot) => slot.kind),
  );
  assert.equal(nineSlotError(lesson.blocks), null);
  assert.equal(LEARNER_STEPS.length, 8);
  assert.equal(parseBlocks(lesson.blocks).ok, true);
});

test("one lesson step at 1440 stays within two viewport heights", () => {
  const lesson = readyLesson({ id: "height", orgId: "org-1", title: "Height" });
  for (const step of LEARNER_STEPS) {
    const measure = measureLessonStep(lesson, step.id, LESSON_VIEWPORT);
    assert.equal(measure.fits, true, step.id);
    assert.ok(measure.scrollHeight <= LESSON_VIEWPORT.innerHeight * 2);
    const html = renderLessonStepHtml({ lesson, step: step.id, signedIn: true, viewport: LESSON_VIEWPORT });
    assert.match(html, new RegExp(`data-step="${step.id}"`));
    assert.match(html, new RegExp(`data-scroll-height="${measure.scrollHeight}"`));
    assert.match(html, /Pass at 75%/);
  }
  const filmed = { ...lesson, film: { provider: "youtube", videoId: "abc123" } };
  const example = measureLessonStep(filmed, "example", LESSON_VIEWPORT);
  assert.equal(example.fits, true);
  const filmHtml = renderLessonStepHtml({ lesson: filmed, step: "example", signedIn: true });
  assert.equal((filmHtml.match(/data-player-count="1"/g) ?? []).length, 1);
  assert.equal((filmHtml.match(/<button/g) ?? []).length, 0);
  const fat = setTextSlot(lesson, 0, "word ".repeat(8000));
  assert.equal(measureLessonStep(fat, "overview", LESSON_VIEWPORT).fits, false);
  const overview = renderLessonStepHtml({ lesson, step: "overview", signedIn: true });
  assert.equal((overview.match(/m10-fill/g) ?? []).length, 1);
});

test("guest continuity is absent for a signed-in lesson", () => {
  const lesson = readyLesson({ id: "guest", orgId: "org-1", title: "Guest" });
  const guest = renderLessonStepHtml({ lesson, step: "overview", signedIn: false });
  const signed = renderLessonStepHtml({ lesson, step: "overview", signedIn: true });
  assert.match(guest, new RegExp(GUEST_CONTINUITY_COPY));
  assert.match(guest, /#5C5850/);
  assert.doesNotMatch(signed, new RegExp(GUEST_CONTINUITY_COPY));
  assert.doesNotMatch(signed, /What a guest keeps/);
  const player = read("src/components/library/lesson-player.tsx");
  assert.match(player, /signedIn \? null :/);
  assert.match(player, /GuestContinuity/);
});

test("a child-scoped sessions list never includes recap body text", () => {
  const rows = sessionCatalog();
  const child = renderSessionHtml(rows, "child");
  const member = renderSessionHtml(rows, "member");
  const leader = renderSessionHtml(rows, "leader");
  assert.doesNotMatch(child, /RECIPROCAL_RECAP_BODY/);
  assert.doesNotMatch(child, /DRAFT_RECAP_BODY/);
  assert.doesNotMatch(member, /RECIPROCAL_RECAP_BODY/);
  assert.doesNotMatch(member, /DRAFT_RECAP_BODY/);
  assert.match(member, /Write the next step for the member/);
  assert.match(leader, /RECIPROCAL_RECAP_BODY/);
  assert.equal(sessionsForViewer(rows, "child").every((row) => row.recap === null), true);
  assert.match(read("src/components/library/session-rows.tsx"), /m10-session-row/);
  assert.match(read("src/app/globals.css"), /\.m10-session-row[\s\S]*border-radius: 16px/);
  assert.match(read("src/app/globals.css"), /\.m10-session-row[\s\S]*background: #f6f3ec/);
});

test("the sealed New menu is five quiet leader items and the member rail stays Learn Library You", () => {
  assert.deepEqual(newMenu("family").map((item) => item.label), SEALED_MENU);
  assert.deepEqual(newMenu("team").map((item) => item.label), SEALED_MENU);
  assert.deepEqual(newMenu("family").map((item) => item.href), SEALED_HREFS);
  assert.equal(newMenu("family").some((item) => item.label === "Person in development"), false);
  assert.equal(mobileBar("member", "issue-368").labels.includes("New"), false);
  assert.equal(mobileBar("leader").labels.includes("New"), true);
  const shell = read("src/components/m9/shell.tsx");
  assert.match(shell, /leader \? \(/);
  assert.doesNotMatch(shell, /m9-new-menu[\s\S]{0,500}bg-primary/);
  const css = read("src/app/globals.css");
  assert.match(css, /\.m10-plus,\s*\n\.m10-quiet \{\s*\n\s*background: transparent/);
  assert.match(css, /\.m9-new-menu a \{[\s\S]*background: transparent/);
  assert.equal(MEMBER_RAIL_DEFAULT, "issue-368");
  assert.equal(resolveMemberRail("issue-368"), "issue-368");
  assert.equal(resolveMemberRail(undefined), "issue-368");
  assert.deepEqual(memberDoors("issue-368").map((door) => door.label), ["Learn", "Library", "You"]);
  assert.deepEqual(mobileBar("member", resolveMemberRail("issue-368")).labels, ["Learn", "Library", "You"]);
  assert.equal(M9_METRICS.railPx, 240);
  assert.match(css, /width: 240px/);
  assert.match(shell, /NEXT_PUBLIC_MEMBER_RAIL_VARIANT/);
});

test("go-live flags stay false and M10 copy stays inside the lock", () => {
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
  assert.match(read("src/lib/billing/checkout-destination.ts"), /export const CHECKOUT_GO_LIVE = false/);
  assert.match(read("marketing-site/js/checkout-switch.mjs"), /export const COACHING_GO_LIVE = false/);
  const files = [
    "src/lib/library/m10.ts",
    "src/components/library/tree.tsx",
    "src/components/library/workspace.tsx",
    "src/components/library/session-rows.tsx",
    "src/components/library/block-editor.tsx",
    "src/components/library/lesson-player.tsx",
    "src/components/library/published-learn-list.tsx",
    "src/app/library/page.tsx",
    "src/app/library/brain/page.tsx",
    "src/app/library/sessions/page.tsx",
    "src/app/c/[courseSlug]/[lessonSlug]/page.tsx",
  ];
  const banned = [/—/, /Learn with Ben/, /\bGym\b/, /\bFoundry\b/, /\bRetainer\b/];
  for (const file of files) {
    const source = read(file);
    for (const pattern of banned) assert.doesNotMatch(source, pattern, file);
  }
});

test("Tiptap is the block editor and no Yap-cut lesson is shipped", () => {
  const pkg = JSON.parse(read("package.json"));
  for (const name of ["@tiptap/react", "@tiptap/pm", "@tiptap/core", "@tiptap/starter-kit"]) {
    assert.equal(typeof pkg.dependencies[name], "string");
  }
  const editor = read("src/components/library/block-editor.tsx");
  assert.match(editor, /@tiptap\/react/);
  assert.match(editor, /@tiptap\/starter-kit/);
  assert.match(editor, /getText/);
  assert.doesNotMatch(editor, /getHTML\(/);
  assert.match(editor, /data-storage="json"/);
  assert.equal(YAP_CUT_LESSON_ID, null);
  assert.doesNotMatch(read("src/lib/library/m10.ts"), /provider: "yap"/);
  assert.doesNotMatch(read("src/app/library/brain/page.tsx"), /EdgeList|knowledge_nodes/);
  assert.match(read("src/components/library/lesson-player.tsx"), /m10-outline-drawer/);
  assert.match(read("src/components/library/lesson-player.tsx"), /LessonSpinePlayer/);
  assert.match(read("src/components/library/lesson-player.tsx"), /YoutubeClip/);
});
