import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function coursePath(slug) {
  return `/c/${encodeURIComponent(slug)}`;
}

function courseShareUrl(origin, slug) {
  return `${origin.replace(/\/$/, "")}${coursePath(slug)}`;
}

test("course share links are plain student URLs", () => {
  assert.equal(
    courseShareUrl("https://university.benjohnson.ai", "grok-bot"),
    "https://university.benjohnson.ai/c/grok-bot",
  );
  assert.equal(
    courseShareUrl("https://university.benjohnson.ai/", "new course"),
    "https://university.benjohnson.ai/c/new%20course",
  );
});

test("branding is Field School / Field School University", () => {
  const types = readFileSync(join(root, "src/lib/course/types.ts"), "utf8");
  assert.match(types, /COMPANY_NAME = "Field School"/);
  assert.match(types, /UNI_NAME = "Field School University"/);
  assert.doesNotMatch(types, /Johnson Field School/);

  const rootRoute = readFileSync(join(root, "src/routes/__root.tsx"), "utf8");
  assert.match(rootRoute, /Field School University/);
  assert.doesNotMatch(rootRoute, /Johnson Field School/);

  const cert = readFileSync(
    join(root, "src/routes/c/$courseSlug/certificate.tsx"),
    "utf8",
  );
  assert.match(cert, /UNI_NAME/);
  assert.match(cert, /COMPANY_NAME/);

  const about = readFileSync(join(root, "src/routes/about.tsx"), "utf8");
  assert.match(about, /self-paced/);
  assert.match(about, /tracking/);
  assert.match(about, /AI/);

  const tools = readFileSync(join(root, "src/lib/course/tools.ts"), "utf8");
  assert.match(tools, /intelligence-assessment/);
  assert.match(tools, /skill-assessment/);
  assert.match(tools, /personality-checklist/);
  assert.match(tools, /tool-assessment-checklist/);

  const site = JSON.parse(
    readFileSync(join(root, "src/lib/og/site.json"), "utf8"),
  );
  assert.equal(site.title, "Field School University");
});

test("share control and structured hero exist", () => {
  const share = readFileSync(
    join(root, "src/components/share-course-button.tsx"),
    "utf8",
  );
  assert.match(share, /ShareCourseButton/);
  assert.match(share, /courseShareUrl/);
  assert.doesNotMatch(share, /og\.jpg|hero\.jpg/);

  const hero = readFileSync(
    join(root, "src/components/campus-hero-art.tsx"),
    "utf8",
  );
  assert.match(hero, /CampusHeroArt/);
  assert.match(hero, /Watch\. Work\. Clear\./);

  const index = readFileSync(join(root, "src/routes/index.tsx"), "utf8");
  assert.match(index, /CampusHeroArt/);
  assert.doesNotMatch(index, /hero\.jpg/);
});
