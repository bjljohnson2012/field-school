import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard } from "../src/lib/living-brain/model.ts";
import { lessonSpineContinue, playOutcome, playWriteBody } from "../src/lib/player/play-rail-write.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

test("Remotion preview names the current LessonSpine chapter and caption", () => {
  const preview = read("src/components/lesson-spine-remotion-player.tsx");
  const html5 = read("src/components/lesson-spine-player.tsx");
  const page = read("src/app/play/lesson-spine/page.tsx");
  assert.match(preview, /data-preview-craft="chapter"/);
  assert.match(preview, /data-chapter-label=\{chapter\.label\}/);
  assert.match(preview, /data-preview-caption=\{chapter\.id\}/);
  assert.match(preview, /data-chapter-rail="lesson-spine"/);
  assert.match(preview, /data-caption=\{label\}/);
  assert.match(preview, /interpolate\(/);
  assert.match(preview, /useCurrentFrame/);
  assert.match(preview, /#EFE7D6/);
  assert.match(preview, /#C4A35A/);
  assert.match(preview, /#1A1A16/);
  assert.match(preview, /Household: the child has no login\. Sales: this desk lists no children\./);
  assert.match(preview, /recordPlay\("sting"\)/);
  assert.match(preview, /data-composition="LessonSpine"/);
  assert.match(preview, /data-login="none"/);
  assert.match(preview, /data-sales-children="0"/);
  for (const label of ["Sting", "Slate", "Objective", "Recap", "Next up"]) {
    assert.match(preview, new RegExp(label));
  }
  assert.match(html5, /<video/);
  assert.doesNotMatch(html5, /@remotion|from "remotion"/);
  assert.match(page, /LessonSpinePlayer/);
  assert.match(page, /LessonSpineRemotionPreview/);
  assert.match(page, /Guests/);
  assert.match(page, /do not write/);
  assert.doesNotMatch(preview + html5 + page, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
  assert.doesNotMatch(preview, /@remotion\/cli|@remotion\/renderer|@remotion\/bundler/);
  assert.match(preview, /chosen \?\? restoredId/);
  assert.match(preview, /data-continue-chapter=\{!chosen && continueAt \? continueAt\.chapterId : undefined\}/);
  assert.match(html5, /setCurrent\(continueAt\.startSec\)/);
  assert.match(read("src/components/leave-return-next.tsx"), /data-continue-chapter=\{step\.chapterId\}/);
  assert.match(read("src/components/leave-return-next.tsx"), /href="\/play\/lesson-spine"/);
  assert.match(read("src/components/lesson-spine-play-write.tsx"), /status !== "authenticated" \|\| !email/);
});

function person(overrides) {
  return {
    membershipId: "ada",
    name: "Ada",
    kind: "child",
    login: "none",
    profile: "Reads at the table.",
    outcomes: "",
    ownsOutcomes: false,
    history: [],
    confidence: "",
    ...overrides,
  };
}

test("leave and return restore the same LessonSpine chapter from the living brain", () => {
  const home = {
    orgId: "org-1",
    room: "household",
    facts: "",
    outcome: "",
    people: [person({})],
  };
  const wrote = playWriteBody({ room: "household", brain: home, chapterId: "sting" });
  assert.equal(wrote?.login, "none");
  assert.equal(wrote?.outcomes, "Continue LessonSpine at Slate");
  const homeNext = lessonSpineContinue(wrote.outcomes);
  assert.equal(homeNext?.chapterId, "slate");
  assert.equal(homeNext?.label, "Slate");
  const homeBoard = brainBoard({
    room: "household",
    brain: { ...home, people: [person({ outcomes: wrote.outcomes })] },
  });
  assert.equal(homeBoard.people.every((row) => row.login === "none"), true);
  assert.equal(lessonSpineContinue(homeBoard.people[0].outcomes)?.chapterId, "slate");

  const sales = brainBoard({
    room: "sales",
    brain: {
      orgId: "org-1",
      room: "sales",
      facts: "",
      outcome: "",
      people: [
        person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: playOutcome("sting") }),
        person({
          membershipId: "rep-1",
          name: "Lee",
          kind: "adult",
          login: "member",
          outcomes: playOutcome("slate"),
        }),
      ],
    },
  });
  assert.equal(sales.people.length, 1);
  assert.equal(sales.people.some((row) => row.kind === "child"), false);
  assert.equal(lessonSpineContinue(sales.people[0].outcomes)?.chapterId, "objective");
  assert.equal(lessonSpineContinue(sales.people[0].outcomes)?.label, "Objective");
});
