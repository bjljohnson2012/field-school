import assert from "node:assert/strict";
import test from "node:test";
import {trackBFrameAssert, trackBFrameLog} from "./track-b-frame-assert.mjs";

test("fixture frames cover the Track B beats without a GPU still", () => {
  const frames = trackBFrameAssert();
  assert.equal(frames.ok, true);
  assert.equal(frames.gpu, false);
  assert.equal(frames.rendering, "idle");
  assert.equal(frames.written, false);
  assert.equal(frames.frames["takeover open"], true);
  assert.equal(frames.frames["takeover head-in"], true);
  assert.equal(frames.frames["glide enter"], true);
  assert.equal(frames.frames["mid-hold"], true);
  assert.equal(frames.frames["luma exit"], true);

  const log = trackBFrameLog();
  assert.equal(log.ok, true);
  assert.equal(log.dryRun, true);
  assert.equal(log.gpu, false);
  assert.equal(log.frames, 1050);
  assert.equal(log.written, false);
  assert.equal(log.rendering, "idle");
});
