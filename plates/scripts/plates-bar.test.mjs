import assert from "node:assert/strict";
import {readFileSync, existsSync} from "node:fs";
import {dirname, join} from "node:path";
import {test} from "node:test";
import {fileURLToPath} from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = (...parts) => readFileSync(join(root, ...parts), "utf8");

test("SceneMotion constants match factory", () => {
  const plates = src("src", "sceneMotionMath.ts");
  const factory = src("..", "video-pipeline", "remotion", "src", "sceneMotionMath.ts");
  for (const needle of [
    "export const GLIDE_FRAMES = 24",
    "export const TAKEOVER_HOLD_FRAMES = 12",
    "export const TAKEOVER_EASE_FRAMES = 18",
    "export const LUMA_SEC = 0.5",
  ]) {
    assert.match(plates, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.match(factory, new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});

test("Opener and RecapCard only, 1920x1080@30, 8-12s", () => {
  const rootTsx = src("src", "Root.tsx");
  assert.match(rootTsx, /id="Opener"/);
  assert.match(rootTsx, /id="RecapCard"/);
  assert.doesNotMatch(rootTsx, /DefinitionBoard|QuizBumper|TalkingHeadCard/);
  assert.match(rootTsx, /width=\{1920\}/);
  assert.match(rootTsx, /height=\{1080\}/);
  assert.match(rootTsx, /fps=\{30\}/);
  assert.match(rootTsx, /durationSec: 10/);
  assert.match(src("src", "sceneMotionMath.ts"), /Math.min\(12, Math.max\(8/);
});

test("useCurrentFrame R7 and brand lock", () => {
  const opener = src("src", "Opener.tsx");
  const recap = src("src", "RecapCard.tsx");
  const layers = src("src", "layers.tsx");
  const brand = src("src", "brand.ts");
  assert.match(opener, /useCurrentFrame/);
  assert.match(recap, /useCurrentFrame/);
  assert.doesNotMatch(`${opener}${recap}${layers}`, /animation:|transition:|animate-/);
  assert.doesNotMatch(`${opener}${recap}${layers}`, /setTimeout|setInterval/);
  assert.match(brand, /#EFE7D6/);
  assert.match(brand, /#1A1A16/);
  assert.match(brand, /#C4A35A/);
  assert.match(brand, /x: 1576/);
  assert.match(brand, /y: 24/);
  assert.match(src("src", "Root.tsx"), /x: 1576/);
  assert.match(layers, /<Img/);
  assert.match(layers, /staticFile\("isolated-seal.svg"\)/);
});

test("captions path and antagonist docs exist", () => {
  assert.equal(existsSync(join(root, "public", "captions", "opener.json")), true);
  assert.equal(existsSync(join(root, "public", "captions", "recap.json")), true);
  assert.match(src("AGENTS.md"), /docs\/remotion-vox-standards\.md/);
  assert.match(src("README.md"), /docs\/remotion-vox-standards\.md/);
});

test("package pins have no carets", () => {
  const pkg = JSON.parse(src("package.json"));
  for (const [name, ver] of Object.entries({...pkg.dependencies, ...pkg.devDependencies})) {
    assert.equal(String(ver).startsWith("^") || String(ver).startsWith("~"), false, name);
  }
  assert.equal(pkg.dependencies.remotion, "4.0.526");
  assert.equal(pkg.dependencies["@remotion/cli"], "4.0.526");
  assert.equal(pkg.dependencies["@remotion/google-fonts"], "4.0.526");
});
