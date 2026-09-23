import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { brainBoard } from "../src/lib/living-brain/model.ts";
import { lessonSpineContinue, lessonSpineResume, lessonSpineStep, lessonSpineTeachProve, NEXT_LESSON_STEP, playOutcome, playWriteBody, portionWriteBody, proveCompleteBody, resumeWriteBody } from "../src/lib/player/play-rail-write.ts";

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
  assert.match(preview, /data-resume-cue=/);
  assert.match(preview, /data-preview-craft="chapter"/);
  assert.match(preview, /data-chapter-rail="lesson-spine"/);
  assert.match(preview, /visibilitychange/);
  assert.match(preview, /recordResume/);
  assert.match(preview, /recordPortion/);
  assert.match(preview, /recordPlay\("sting"\)/);
  assert.match(preview, /addEventListener\("seeked"/);
  assert.match(html5, /<video/);
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

test("leave mid-chapter restores the Remotion scrub and caption cue", () => {
  const cue = "Slate. Household: the child has no login. Sales: this desk lists no children.";
  const home = {
    orgId: "org-1",
    room: "household",
    facts: "",
    outcome: "",
    people: [person({ outcomes: "Continue LessonSpine at Slate" })],
  };
  const wrote = resumeWriteBody({ room: "household", brain: home, offsetSec: 4, cue });
  assert.equal(wrote?.login, "none");
  assert.equal(lessonSpineStep(wrote.outcomes), "Continue LessonSpine at Slate");
  assert.deepEqual(lessonSpineResume(wrote.outcomes), { chapterId: "slate", offsetSec: 4, cue });
  assert.equal(resumeWriteBody({ room: "household", brain: home, offsetSec: 0, cue }), null);
  assert.equal(resumeWriteBody({ room: "household", brain: home, offsetSec: 8, cue }), null);
  assert.equal(resumeWriteBody({ room: "household", brain: null, offsetSec: 4, cue }), null);

  const salesBrain = {
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
  };
  const salesWrote = resumeWriteBody({
    room: "sales",
    brain: salesBrain,
    offsetSec: 2,
    cue: "Objective. Household: the child has no login. Sales: this desk lists no children.",
  });
  assert.equal(salesWrote?.membershipId, "rep-1");
  assert.equal(salesWrote?.login, "member");
  assert.equal(lessonSpineResume(salesWrote.outcomes)?.chapterId, "objective");
  assert.equal(lessonSpineResume(salesWrote.outcomes)?.offsetSec, 2);
  const board = brainBoard({ room: "sales", brain: { ...salesBrain, people: salesBrain.people.map((row) => row.membershipId === "rep-1" ? { ...row, outcomes: salesWrote.outcomes } : row) } });
  assert.equal(board.people.some((row) => row.kind === "child"), false);
});

test("finishing a chapter writes the next portion and return opens it", () => {
  const home = {
    orgId: "org-1",
    room: "household",
    facts: "",
    outcome: "",
    people: [person({})],
  };
  const sting = portionWriteBody({ room: "household", brain: home, chapterId: "sting" });
  assert.equal(sting?.login, "none");
  assert.equal(sting?.outcomes, "Continue LessonSpine at Slate");
  assert.equal(lessonSpineContinue(sting.outcomes)?.chapterId, "slate");
  const afterSting = { ...home, people: [person({ outcomes: sting.outcomes })] };
  const slate = portionWriteBody({ room: "household", brain: afterSting, chapterId: "slate" });
  assert.equal(slate?.outcomes, "Continue LessonSpine at Objective");
  assert.equal(lessonSpineContinue(slate.outcomes)?.chapterId, "objective");
  const finished = portionWriteBody({ room: "household", brain: afterSting, chapterId: "nextUp" });
  assert.equal(finished?.outcomes, "Finished LessonSpine");
  assert.equal(lessonSpineContinue(finished.outcomes)?.chapterId, "next-up");
  assert.equal(portionWriteBody({ room: "household", brain: null, chapterId: "sting" }), null);

  const sales = portionWriteBody({
    room: "sales",
    brain: {
      orgId: "org-1",
      room: "sales",
      facts: "",
      outcome: "",
      people: [
        person({ membershipId: "kid", name: "No", kind: "child", login: "none" }),
        person({ membershipId: "rep-1", name: "Lee", kind: "adult", login: "member" }),
      ],
    },
    chapterId: "objective",
  });
  assert.equal(sales?.membershipId, "rep-1");
  assert.equal(sales?.login, "member");
  assert.equal(sales?.outcomes, "Continue LessonSpine at Recap");
  assert.equal(playWriteBody({ room: "household", brain: home, chapterId: "sting" })?.outcomes, sting.outcomes);
});

test("leave and return consumes the next portion into Teach and Prove", () => {
  const preview = read("src/components/lesson-spine-remotion-player.tsx");
  const html5 = read("src/components/lesson-spine-player.tsx");
  const page = read("src/app/play/lesson-spine/page.tsx");
  const home = {
    orgId: "org-1",
    room: "household",
    facts: "",
    outcome: "",
    people: [person({})],
  };
  const sting = portionWriteBody({ room: "household", brain: home, chapterId: "sting" });
  const opened = lessonSpineTeachProve(sting.outcomes);
  assert.equal(sting?.login, "none");
  assert.equal(opened?.teach, "Continue LessonSpine at Slate");
  assert.equal(opened?.prove, "Continue LessonSpine at Slate");
  assert.equal(opened?.chapterId, "slate");
  assert.equal(opened?.label, "Slate");
  assert.equal(lessonSpineTeachProve("not a spine step"), null);
  const finished = portionWriteBody({
    room: "household",
    brain: { ...home, people: [person({ outcomes: sting.outcomes })] },
    chapterId: "nextUp",
  });
  const done = lessonSpineTeachProve(finished.outcomes);
  assert.equal(done?.teach, "Finished LessonSpine");
  assert.equal(done?.prove, "Finished LessonSpine");
  assert.equal(done?.chapterId, "next-up");

  const salesBrain = {
    orgId: "org-1",
    room: "sales",
    facts: "",
    outcome: "",
    people: [
      person({ membershipId: "kid", name: "No", kind: "child", login: "none" }),
      person({ membershipId: "rep-1", name: "Lee", kind: "adult", login: "member" }),
    ],
  };
  const sales = portionWriteBody({ room: "sales", brain: salesBrain, chapterId: "objective" });
  const board = brainBoard({
    room: "sales",
    brain: {
      ...salesBrain,
      people: salesBrain.people.map((row) =>
        row.membershipId === sales.membershipId ? { ...row, outcomes: sales.outcomes } : row,
      ),
    },
  });
  assert.equal(board.people.some((row) => row.kind === "child"), false);
  assert.equal(sales?.login, "member");
  const salesOpen = lessonSpineTeachProve(board.people[0].outcomes);
  assert.equal(salesOpen?.teach, "Continue LessonSpine at Recap");
  assert.equal(salesOpen?.prove, "Continue LessonSpine at Recap");
  assert.equal(salesOpen?.chapterId, "recap");

  assert.match(preview, /lessonSpineTeachProve\(continueAt\.step\)/);
  assert.match(preview, /data-consume-portion="living-brain"/);
  assert.match(preview, /data-teach-portion=\{opened\.teach\}/);
  assert.match(preview, /data-prove-portion=\{opened\.prove\}/);
  assert.match(preview, /data-teach-chapter=\{opened\.chapterId\}/);
  assert.match(preview, /data-prove-chapter=\{opened\.chapterId\}/);
  assert.match(preview, /href="\/teach-live"/);
  assert.match(preview, /href="#lesson-spine-prove"/);
  assert.match(preview, /id="lesson-spine-prove"/);
  assert.match(preview, /The child has no login\./);
  assert.match(preview, /This desk lists no children\./);
  assert.match(preview, /data-preview-craft="chapter"/);
  assert.match(preview, /data-chapter-rail="lesson-spine"/);
  assert.match(preview, /recordPortion/);
  assert.match(html5, /<video/);
  assert.doesNotMatch(html5, /@remotion|from "remotion"|data-consume-portion/);
  assert.match(page, /LessonSpinePlayer/);
  assert.match(page, /Guests/);
  assert.match(page, /do not write/);
  assert.match(read("src/components/lesson-spine-play-write.tsx"), /status !== "authenticated" \|\| !email/);
  assert.match(read("src/components/leave-return-next.tsx"), /href="\/play\/lesson-spine"/);
  assert.doesNotMatch(preview + html5 + page, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});

test("finishing Prove writes the next chapter and return opens it", () => {
  const preview = read("src/components/lesson-spine-remotion-player.tsx");
  const html5 = read("src/components/lesson-spine-player.tsx");
  const hook = read("src/components/lesson-spine-play-write.tsx");
  const home = {
    orgId: "org-1",
    room: "household",
    facts: "",
    outcome: "",
    people: [person({})],
  };
  const consumed = portionWriteBody({ room: "household", brain: home, chapterId: "sting" });
  const opened = lessonSpineTeachProve(consumed.outcomes);
  const afterConsume = { ...home, people: [person({ outcomes: consumed.outcomes })] };
  const proved = proveCompleteBody({
    room: "household",
    brain: afterConsume,
    chapterId: opened.chapterId,
  });
  assert.equal(consumed?.login, "none");
  assert.equal(opened?.chapterId, "slate");
  assert.equal(proved?.login, "none");
  assert.equal(proved?.outcomes, "Continue LessonSpine at Objective");
  assert.equal(lessonSpineContinue(proved.outcomes)?.chapterId, "objective");
  assert.equal(lessonSpineContinue(proved.outcomes)?.label, "Objective");
  assert.equal(proveCompleteBody({ room: "household", brain: null, chapterId: "slate" }), null);
  const finishedBrain = { ...home, people: [person({ outcomes: "Finished LessonSpine" })] };
  const stay = proveCompleteBody({ room: "household", brain: finishedBrain, chapterId: "next-up" });
  assert.equal(stay?.outcomes, NEXT_LESSON_STEP);
  assert.equal(lessonSpineContinue(stay.outcomes)?.label, "Next lesson");
  assert.equal(lessonSpineContinue(stay.outcomes)?.chapterId, "sting");

  const salesBrain = {
    orgId: "org-1",
    room: "sales",
    facts: "",
    outcome: "",
    people: [
      person({ membershipId: "kid", name: "No", kind: "child", login: "none" }),
      person({
        membershipId: "rep-1",
        name: "Lee",
        kind: "adult",
        login: "member",
        outcomes: "Continue LessonSpine at Objective",
      }),
    ],
  };
  const salesOpen = lessonSpineTeachProve(
    brainBoard({ room: "sales", brain: salesBrain }).people[0].outcomes,
  );
  const sales = proveCompleteBody({
    room: "sales",
    brain: salesBrain,
    chapterId: salesOpen.chapterId,
  });
  const board = brainBoard({
    room: "sales",
    brain: {
      ...salesBrain,
      people: salesBrain.people.map((row) =>
        row.membershipId === sales.membershipId ? { ...row, outcomes: sales.outcomes } : row,
      ),
    },
  });
  assert.equal(board.people.some((row) => row.kind === "child"), false);
  assert.equal(sales?.membershipId, "rep-1");
  assert.equal(sales?.login, "member");
  assert.equal(sales?.outcomes, "Continue LessonSpine at Recap");
  assert.equal(lessonSpineContinue(board.people[0].outcomes)?.chapterId, "recap");
  assert.equal(
    portionWriteBody({ room: "household", brain: afterConsume, chapterId: "slate" })?.outcomes,
    proved.outcomes,
  );

  assert.match(preview, /recordProve\(opened\.chapterId\)/);
  assert.match(preview, /data-prove-complete="living-brain"/);
  assert.match(preview, /data-prove-complete-chapter=\{opened\.chapterId\}/);
  assert.match(preview, /data-consume-portion="living-brain"/);
  assert.match(preview, /data-preview-craft="chapter"/);
  assert.match(preview, /data-chapter-rail="lesson-spine"/);
  assert.match(preview, /recordPortion/);
  assert.match(preview, /recordPlay\("sting"\)/);
  assert.match(hook, /proveCompleteBody\(/);
  assert.match(hook, /status !== "authenticated" \|\| !email/);
  assert.match(hook, /fs-lesson-spine-prove/);
  assert.match(html5, /<video/);
  assert.doesNotMatch(html5, /@remotion|from "remotion"|data-prove-complete/);
  assert.match(read("src/components/leave-return-next.tsx"), /href="\/play\/lesson-spine"/);
  assert.doesNotMatch(preview + html5 + hook, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});

test("Prove on the final chapter writes the next lesson and return opens it", () => {
  const preview = read("src/components/lesson-spine-remotion-player.tsx");
  const html5 = read("src/components/lesson-spine-player.tsx");
  const page = read("src/app/play/lesson-spine/page.tsx");
  const home = {
    orgId: "org-1",
    room: "household",
    facts: "",
    outcome: "",
    people: [person({ outcomes: "Continue LessonSpine at Next up" })],
  };
  const proved = proveCompleteBody({ room: "household", brain: home, chapterId: "next-up" });
  const opened = lessonSpineContinue(proved.outcomes);
  assert.equal(proved?.login, "none");
  assert.equal(proved?.outcomes, NEXT_LESSON_STEP);
  assert.equal(lessonSpineStep(proved.outcomes), NEXT_LESSON_STEP);
  assert.equal(opened?.label, "Next lesson");
  assert.equal(opened?.chapterId, "sting");
  assert.equal(opened?.startSec, 0);
  assert.equal(lessonSpineTeachProve(proved.outcomes)?.teach, NEXT_LESSON_STEP);
  assert.equal(lessonSpineTeachProve(proved.outcomes)?.prove, NEXT_LESSON_STEP);
  assert.equal(portionWriteBody({ room: "household", brain: home, chapterId: "nextUp" })?.outcomes, "Finished LessonSpine");
  assert.equal(playOutcome("next-up"), "Finished LessonSpine");
  assert.equal(proveCompleteBody({ room: "household", brain: null, chapterId: "next-up" }), null);

  const salesBrain = {
    orgId: "org-1",
    room: "sales",
    facts: "",
    outcome: "",
    people: [
      person({ membershipId: "kid", name: "No", kind: "child", login: "none", outcomes: "Finished LessonSpine" }),
      person({
        membershipId: "rep-1",
        name: "Lee",
        kind: "adult",
        login: "member",
        outcomes: "Continue LessonSpine at Next up",
      }),
    ],
  };
  const sales = proveCompleteBody({ room: "sales", brain: salesBrain, chapterId: "nextUp" });
  const board = brainBoard({
    room: "sales",
    brain: {
      ...salesBrain,
      people: salesBrain.people.map((row) =>
        row.membershipId === sales.membershipId ? { ...row, outcomes: sales.outcomes } : row,
      ),
    },
  });
  assert.equal(board.people.some((row) => row.kind === "child"), false);
  assert.equal(sales?.login, "member");
  assert.equal(sales?.outcomes, NEXT_LESSON_STEP);
  assert.equal(lessonSpineContinue(board.people[0].outcomes)?.chapterId, "sting");
  assert.equal(lessonSpineContinue(board.people[0].outcomes)?.label, "Next lesson");

  assert.match(preview, /data-next-lesson=\{opened\.label === "Next lesson" \? "living-brain" : undefined\}/);
  assert.match(preview, /continueAt\?\.label === "Next lesson" \? "Next lesson" : chapter\.label/);
  assert.match(preview, /Household: the child has no login\. Sales: this desk lists no children\./);
  assert.match(preview, /data-preview-caption=\{chapter\.id\}/);
  assert.match(preview, /data-chapter-rail="lesson-spine"/);
  assert.match(preview, /recordProve\(opened\.chapterId\)/);
  assert.match(html5, /<video/);
  assert.doesNotMatch(html5, /@remotion|from "remotion"/);
  assert.match(page, /af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4/);
  assert.match(read("src/components/leave-return-next.tsx"), /href="\/play\/lesson-spine"/);
  assert.doesNotMatch(preview + page, /JTBD|Jobs-to-be-Done|hire path|parent hire/);
});
