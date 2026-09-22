import assert from "node:assert/strict";
import {existsSync, readFileSync} from "node:fs";
import {dirname, join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const LIVE = ["Opener", "TalkingHead", "RecapCard", "QuizBumper"];
const LAYERS = ["bed", "talking-head", "captions", "letterbox", "audio"];
const DEST =
  "af374d95ee71b4609acae0c76eff7610aa013ee8092cb18051ff511afb220ee4";

function readJson(name) {
  return JSON.parse(readFileSync(join(root, name), "utf8"));
}

test("master job is queued and names the four live plates plus a captions layer", () => {
  const job = readJson("queue/master.json");
  assert.equal(job.status, "queued");
  assert.equal(job.render, false);
  assert.equal(job.encoded, false);
  assert.equal(job.output.file, "master.mp4");
  assert.equal(job.output.encoded, false);
  assert.equal(job.aspect, "16:9");
  assert.equal(job.width, 1920);
  assert.equal(job.height, 1080);
  assert.equal(job.fps, 30);
  assert.deepEqual(
    job.plates.map((plate) => plate.name),
    LIVE,
  );
  assert.deepEqual(job.order, LIVE);
  assert.deepEqual(job.layers, LAYERS);
  assert.equal(job.captions.role, "layer");
  assert.equal(job.captions.plate, false);
  assert.equal(job.captions.on, "TalkingHead");
  assert.equal(job.antagonistOnLiveTake, false);
  assert.equal(job.locks.justCapId, "27pn9xs0zk8a73g");
  assert.equal(job.locks.just, "locked");
  assert.equal(job.locks.destSha256, DEST);
  assert.equal(job.locks.dest, "untouched");
  assert.equal(job.locks.renderLock, "stays");
  assert.equal(job.locks.remotionMcp, false);
  assert.equal(job.locks.remotionInNext, false);
  assert.equal(job.locks.launch, "CLOSED 0/8");

  const quiz = job.plates.find((plate) => plate.name === "QuizBumper");
  assert.equal(quiz.source_unit_id, "lesson-opener");
  assert.equal(
    job.plates.find((plate) => plate.name === "TalkingHead").compositionId,
    "TalkingHeadCard",
  );

  let cursor = 0;
  for (const plate of job.plates) {
    assert.equal(plate.fromMs, cursor);
    assert.equal(plate.toMs - plate.fromMs, plate.durationSec * 1000);
    cursor = plate.toMs;
  }
  assert.equal(cursor, 35000);
  assert.equal(existsSync(join(root, "out", "master.mp4")), false);
  assert.equal(existsSync(join(root, "master.mp4")), false);
});

test("cuts.json is a 9:16 cut list for later, not a vertical pack or a render", () => {
  const job = readJson("queue/master.json");
  const cuts = readJson("cuts.json");
  assert.equal(cuts.kind, "cut-list");
  assert.equal(cuts.aspect, "9:16");
  assert.equal(cuts.later, true);
  assert.equal(cuts.verticalPack, false);
  assert.equal(cuts.render, false);
  assert.equal(cuts.sourceAspect, "16:9");
  assert.equal(cuts.cuts.length, job.plates.length);
  const names = new Set(LIVE);
  cuts.cuts.forEach((cut, index) => {
    const plate = job.plates[index];
    assert.equal(names.has(cut.plate), true);
    assert.equal(cut.plate, plate.name);
    assert.equal(cut.inMs, plate.fromMs);
    assert.equal(cut.outMs, plate.toMs);
    assert.equal(cut.aspect, "9:16");
  });
  assert.equal(
    cuts.cuts.some((cut) => cut.plate === "DefinitionBoard"),
    false,
  );
  assert.equal(cuts.cuts[1].captions, "layer");
  assert.equal(cuts.cuts[3].source_unit_id, "lesson-opener");
});
