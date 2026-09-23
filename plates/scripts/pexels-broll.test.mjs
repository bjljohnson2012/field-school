import assert from "node:assert/strict";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { loadCachedBroll, searchAndCachePexelsBroll } from "./pexels-broll.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const src = (name) => readFileSync(join(here, "..", "src", name), "utf8");

const video = {
  id: 4401,
  url: "https://www.pexels.com/video/classroom-4401/",
  user: { name: "Ada Frame", url: "https://www.pexels.com/@ada" },
  video_files: [
    { file_type: "video/mp4", width: 1920, link: "https://images.pexels.com/videos/4401/hd.mp4" },
    { file_type: "video/mp4", width: 640, link: "https://images.pexels.com/videos/4401/sd.mp4" },
  ],
};

test("search caches Pexels b-roll with a raw key and persisted attribution", async () => {
  const prior = process.env.PEXELS_API_KEY;
  process.env.PEXELS_API_KEY = "pexels-test-key";
  const calls = [];
  const fetchImpl = async (url, init) => {
    const href = String(url);
    calls.push({ href, authorization: init?.headers?.Authorization ?? null });
    if (href.includes("/videos/search")) {
      return { ok: true, status: 200, json: async () => ({ videos: [video] }) };
    }
    return { ok: true, status: 200, arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer };
  };
  try {
    const cacheDir = mkdtempSync(join(tmpdir(), "pexels-broll-"));
    const cached = await searchAndCachePexelsBroll({
      query: "classroom",
      cacheDir,
      fetchImpl,
    });
    assert.equal(calls[0].href.startsWith("https://api.pexels.com/videos/search"), true);
    assert.equal(calls[0].authorization, process.env.PEXELS_API_KEY);
    assert.equal(calls[0].authorization.startsWith("Bearer"), false);
    assert.equal(calls[1].href, "https://images.pexels.com/videos/4401/sd.mp4");
    assert.equal(calls[1].authorization, null);
    const sidecar = JSON.parse(readFileSync(join(cacheDir, "4401.json"), "utf8"));
    assert.deepEqual(sidecar, {
      id: "4401",
      query: "classroom",
      photographer: "Ada Frame",
      photographerUrl: "https://www.pexels.com/@ada",
      pexelsUrl: "https://www.pexels.com/video/classroom-4401/",
      file: "4401.mp4",
    });
    assert.equal(readFileSync(cached.path).length, 4);
    const props = loadCachedBroll(cacheDir, "4401");
    assert.equal(props.file, cached.path);
    assert.equal(props.photographer, "Ada Frame");
    assert.equal(props.pexelsUrl, sidecar.pexelsUrl);
  } finally {
    if (prior == null) delete process.env.PEXELS_API_KEY;
    else process.env.PEXELS_API_KEY = prior;
  }
});

test("a Bearer-prefixed env value is sent as the raw key", async () => {
  const calls = [];
  const fetchImpl = async (url, init) => {
    calls.push(init?.headers?.Authorization ?? null);
    if (String(url).includes("/videos/search")) {
      return { ok: true, status: 200, json: async () => ({ videos: [video] }) };
    }
    return { ok: true, status: 200, arrayBuffer: async () => Uint8Array.from([9]).buffer };
  };
  const cacheDir = mkdtempSync(join(tmpdir(), "pexels-bearer-"));
  await searchAndCachePexelsBroll({
    query: "classroom",
    cacheDir,
    apiKey: "Bearer pexels-test-key",
    fetchImpl,
  });
  assert.equal(calls[0], "pexels-test-key");
  assert.equal(String(calls[0]).startsWith("Bearer"), false);
});

test("LessonSpine and the Pexels plate can use the cached b-roll", () => {
  const plate = src("PexelsBroll.tsx");
  const spine = src("LessonSpine.tsx");
  const root = src("Root.tsx");
  const checker = readFileSync(join(here, "remotion-soft-craft-notes.mjs"), "utf8");
  assert.match(plate, /OffthreadVideo/);
  assert.match(plate, /useCurrentFrame/);
  assert.match(plate, /data-pexels-attribution="cached"/);
  assert.match(root, /id="PexelsBroll"/);
  assert.match(spine, /<PexelsBroll \{\.\.\.broll\} \/>/);
  assert.match(spine, /name="sting"/);
  assert.match(spine, /name="broll"/);
  assert.match(checker, /kind: "multi-objective"/);
  assert.match(checker, /kind: "wcag-contrast"/);
  assert.match(checker, /kind: "flicker"/);
  assert.match(checker, /kind: "duration-band"/);
  assert.match(checker, /kind: "missing-use-current-frame"/);
  assert.match(checker, /kind: "css-timer-motion"/);
  assert.match(checker, /kind: "audio-desync"/);
  assert.match(checker, /kind: "caption-cue-drift"/);
  assert.match(checker, /kind: "missing-chapter-boundary"/);
  assert.match(checker, /cleaningFlip: false/);
  assert.doesNotMatch(plate + spine + checker, /EDU-S03|27pn9xs0zk8a73g|af374d95|AUTH_URL|HARD_FAIL/);
  assert.doesNotMatch(plate + spine, /Bearer /);
});
