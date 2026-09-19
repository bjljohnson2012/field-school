import assert from "node:assert/strict";
import {existsSync, mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = (...parts) => readFileSync(join(root, ...parts), "utf8");
const NEW_DEST =
  "/opt/cursor/artifacts/lesson-spine-reencode-captions/2026-09-19/LessonSpine.mp4";
const OLD_DEST = "/opt/cursor/artifacts/lesson-spine-encode/2026-09-19/LessonSpine.mp4";

test("slate TalkingHead uses LowerThird + CaptionsBand; ORDER LOCK unchanged", () => {
  const head = src("src", "TalkingHeadCard.tsx");
  const layers = src("src", "layers.tsx");
  const spine = src("src", "LessonSpine.tsx");
  const readme = src("README.md");
  assert.match(head, /<LowerThird name=\{name\} role=\{role\}/);
  assert.match(head, /<Karaoke captions=\{captions\}/);
  assert.match(layers, /export function CaptionsBand/);
  assert.match(layers, /return <CaptionsBand captions=\{captions\} \/>/);
  assert.match(spine, /name="sting"/);
  assert.match(spine, /name="slate"/);
  assert.match(spine, /<TalkingHeadCard /);
  const sting = spine.indexOf('name="sting"');
  const slate = spine.indexOf('name="slate"');
  const objective = spine.indexOf('name="objective"');
  const recap = spine.indexOf('name="recap"');
  const next = spine.indexOf('name="next-up"');
  assert.ok(sting < slate && slate < objective && objective < recap && recap < next);
  assert.match(
    readme,
    /Locked pedagogical order: Opener\/sting → TalkingHead\/slate → DefinitionBoard\/objective → RecapCard → QuizBumper\/next-up/,
  );
  assert.match(src("encode-lesson-spine-reencode-captions.md"), /lesson-spine-reencode-captions\/2026-09-19/);
  assert.doesNotMatch(src("encode-lesson-spine-reencode-captions.md"), /27pn9xs0zk8a73g\/master/);
  assert.notEqual(NEW_DEST, OLD_DEST);
});

test("render-lock dry-run forwards the new dest and refuses Just", () => {
  const dir = mkdtempSync(join(tmpdir(), "reencode-lock-"));
  const missingLock = join(dir, "absent.render.lock");
  const meminfo = join(dir, "meminfo");
  writeFileSync(meminfo, "MemAvailable: 8192000 kB\n");
  const ok = spawnSync(
    process.execPath,
    [
      join(here, "render-plate.mjs"),
      "--comp",
      "LessonSpine",
      "--dest",
      NEW_DEST,
      "--lock",
      missingLock,
      "--meminfo",
      meminfo,
      "--dry-run",
    ],
    {encoding: "utf8"},
  );
  assert.equal(ok.status, 0, ok.stderr);
  const body = JSON.parse(ok.stdout);
  assert.equal(body.ok, true);
  assert.equal(body.dest, NEW_DEST);
  assert.equal(body.concurrency, 2);
  const just = spawnSync(
    process.execPath,
    [
      join(here, "render-plate.mjs"),
      "--comp",
      "LessonSpine",
      "--cap-id",
      "27pn9xs0zk8a73g",
      "--dest",
      NEW_DEST,
      "--lock",
      missingLock,
      "--meminfo",
      meminfo,
      "--dry-run",
    ],
    {encoding: "utf8"},
  );
  assert.equal(just.status, 2);
  assert.equal(JSON.parse(just.stdout).error, "locked_dest");
});

test("new dest is not Just or Aug 30; encode note exists", () => {
  assert.equal(existsSync(join(root, "encode-lesson-spine-reencode-captions.md")), true);
  assert.doesNotMatch(NEW_DEST, /27pn9xs0zk8a73g/);
  assert.doesNotMatch(NEW_DEST, /everything-made-up\.mp4/);
  assert.match(src("README.md"), /encode-lesson-spine-reencode-captions/);
  assert.equal(existsSync(join(root, "antagonist-lesson-spine-reencode-captions.md")), true);
});
