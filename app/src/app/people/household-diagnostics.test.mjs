import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { SALES_DIAGNOSTIC_SLUGS } from "../insights/aggregate.ts";
import {
  COACHING_SKILLS,
  HOUSEHOLD_SKILLS,
  SALES_SKILLS,
  cardSkillsForOrg,
} from "../../lib/campus-runtime/lessons.ts";

function isSalesDiagnostic(skill) {
  return skill.scale === "0-100" || SALES_DIAGNOSTIC_SLUGS.has(skill.slug);
}

test("household person card renders zero sales diagnostics and sales rows stay", () => {
  const salesBefore = cardSkillsForOrg("sales");
  const household = cardSkillsForOrg("household");
  const salesAfter = cardSkillsForOrg("sales");

  assert.deepEqual(salesBefore, salesAfter);
  assert.deepEqual(
    household.map((skill) => ({ slug: skill.slug, scale: skill.scale })),
    HOUSEHOLD_SKILLS.map((skill) => ({ slug: skill.slug, scale: "1-4" })),
  );
  assert.equal(household.filter(isSalesDiagnostic).length, 0);
  assert.equal(
    household.some((skill) => skill.name === "Discovery"),
    false,
  );

  assert.deepEqual(
    salesAfter.map((skill) => ({ slug: skill.slug, name: skill.name, scale: skill.scale })),
    [
      ...COACHING_SKILLS.map((skill) => ({
        slug: skill.slug,
        name: skill.name,
        scale: skill.scale,
      })),
      ...SALES_SKILLS.map((skill) => ({
        slug: skill.slug,
        name: skill.name,
        scale: "1-4",
      })),
    ],
  );
  assert.equal(salesAfter.some((skill) => skill.scale === "0-100"), true);
  assert.equal(
    salesAfter.some((skill) => SALES_DIAGNOSTIC_SLUGS.has(skill.slug)),
    true,
  );

  const page = readFileSync(new URL("./[membershipId]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /cardSkillsForOrg\(subject\.orgSlug\)/);
  assert.match(page, /<SkillCard skills=\{scoreTiles\} \/>/);
  assert.match(page, /skill\.scale === "0-100" \? source : null/);
});
