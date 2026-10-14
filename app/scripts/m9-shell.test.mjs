import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import {
  COACHING_REDIRECTS,
  HERO_C,
  LEADER_DOORS,
  M9_METRICS,
  MEMBER_RAIL_DEFAULT,
  OFFER_NAMES,
  activeSessionsReady,
  coachingRedirect,
  flipStaggerMs,
  memberDoors,
  mobileBar,
  newMenu,
  resolveMemberRail,
} from "../src/lib/shell/m9-shell.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const abs = join(dir, name);
    if (statSync(abs).isDirectory()) walk(abs, out);
    else if (/\.(tsx|ts|css)$/.test(name)) out.push(abs);
  }
  return out;
}

test("member rail defaults to issue 368 and keeps SHELLS behind an explicit switch", () => {
  assert.equal(MEMBER_RAIL_DEFAULT, "issue-368");
  assert.equal(resolveMemberRail(undefined), "issue-368");
  assert.equal(resolveMemberRail(null), "issue-368");
  assert.equal(resolveMemberRail(""), "issue-368");
  assert.equal(resolveMemberRail("issue-368"), "issue-368");
  assert.equal(resolveMemberRail("learn-me"), "issue-368");
  assert.equal(resolveMemberRail("shells"), "shells");
  assert.deepEqual(
    memberDoors("shells").map((door) => door.label),
    ["Learn", "Me"],
  );
  assert.deepEqual(
    memberDoors("issue-368").map((door) => door.label),
    ["Learn", "Library", "You"],
  );
  assert.equal(M9_METRICS.railPx, 240);
  const shell = read("src/components/m9/shell.tsx");
  assert.match(shell, /resolveMemberRail\(process\.env\.NEXT_PUBLIC_MEMBER_RAIL_VARIANT\)/);
  assert.doesNotMatch(shell, /MEMBER_RAIL_DEFAULT = "issue-368"/);
});

test("390px bar is 56px plus safe area for each role", () => {
  const leader = mobileBar("leader");
  const member = mobileBar("member");
  const switched = mobileBar("member", "shells");
  assert.equal(leader.heightPx, 56);
  assert.equal(leader.safeArea, true);
  assert.deepEqual(leader.labels, ["Learn", "People", "Library", "Insights", "New"]);
  assert.deepEqual(member.labels, ["Learn", "Library", "You"]);
  assert.equal(member.variant, "issue-368");
  assert.deepEqual(switched.labels, ["Learn", "Me"]);
  assert.equal(switched.variant, "shells");
  const css = read("src/app/globals.css");
  assert.match(css, /height: calc\(56px \+ env\(safe-area-inset-bottom\)\)/);
  assert.deepEqual(
    LEADER_DOORS.map((door) => door.label),
    ["Learn", "People", "Library", "Insights"],
  );
});

test("coaching routes 301 and reviews and compare are not kept", () => {
  assert.equal(coachingRedirect("/coaching"), "/teams/services");
  assert.equal(coachingRedirect("/coaching/"), "/teams/services");
  assert.equal(coachingRedirect("/coaching/reviews"), "/teams/practice/reviews");
  assert.equal(coachingRedirect("/coaching/compare"), "/teams/practice/compare");
  assert.equal(coachingRedirect("/coaching/knowledge"), "/teams/practice/knowledge");
  assert.equal(coachingRedirect("/api/coaching/tasks"), null);
  for (const row of COACHING_REDIRECTS) {
    assert.equal(row.status, 301);
    assert.equal(coachingRedirect(row.from), row.to);
  }
  const proxy = read("src/proxy.ts");
  assert.match(proxy, /NextResponse\.redirect\(url, 301\)/);
  assert.match(proxy, /\/coaching\/:path\*/);
  assert.match(read("src/app/teams/practice/[slug]/page.tsx"), /reviews/);
  assert.match(read("src/app/teams/practice/[slug]/page.tsx"), /compare/);
});

test("hero C is verbatim and the go-live flags stay false", () => {
  const home = read("src/app/campus-home.tsx");
  assert.match(home, new RegExp(HERO_C.kicker));
  assert.match(home, new RegExp(HERO_C.h1.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(home, /Start free/);
  assert.match(home, /See pricing/);
  assert.match(home, /https:\/\/fieldschool\.ai\/pricing/);
  assert.equal(HERO_C.risk, "One course is free. No card.");
  assert.match(home, /One course is free\. No card\./);
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
  assert.deepEqual([...OFFER_NAMES], ["Do It Yourself", "Coaching", "Consulting"]);
  assert.match(read("src/app/settings/billing/page.tsx"), /Do It Yourself/);
});

test("Flip Text is CSS only, once, and plain under reduced motion", () => {
  const css = read("src/app/globals.css");
  const flip = read("src/components/m9/flip-text.tsx");
  assert.match(css, /@keyframes m9-flip/);
  assert.match(css, /animation-iteration-count: 1/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.m9-flip-char[\s\S]*animation: none !important/);
  assert.match(css, /transform: none !important/);
  assert.match(css, /filter: none !important/);
  assert.doesNotMatch(flip, /from ["']motion|from ["']@\/components\/m9\/motion/);
  assert.match(flip, /data-flip-text="wizard-finish"/);
  assert.equal(M9_METRICS.flipTextMaxMs, 900);
  assert.equal(M9_METRICS.flipTextStaggerMs, 200);
  assert.equal(flipStaggerMs(0, 4), 0);
  assert.ok(flipStaggerMs(3, 4) <= 200);
  const wizard = read("src/components/profile-m2/assessment-wizard.tsx");
  assert.match(wizard, /FlipText/);
  assert.equal(
    walk(join(root, "src")).filter((abs) => readFileSync(abs, "utf8").includes("<FlipText")).length,
    1,
  );
});

test("motion is imported only by the shell and Active Sessions, with no Radix or duo-icons", () => {
  const srcFiles = walk(join(root, "src")).filter((abs) => abs.endsWith(".ts") || abs.endsWith(".tsx"));
  const motionImporters = srcFiles.filter((abs) =>
    /from ["']@\/components\/m9\/motion["']/.test(readFileSync(abs, "utf8")),
  );
  assert.deepEqual(
    motionImporters.map((abs) => abs.slice(root.length + 1)).sort(),
    ["src/components/m9/active-sessions.tsx", "src/components/m9/shell.tsx"],
  );
  const joined = srcFiles.map((abs) => readFileSync(abs, "utf8")).join("\n");
  assert.doesNotMatch(joined, /@radix-ui|@duo-icons|from ["']motion["']/);
  assert.equal(activeSessionsReady(), false);
  assert.match(read("src/components/m9/active-sessions.tsx"), /if \(!activeSessionsReady\(\)\) return null/);
  assert.doesNotMatch(read("src/components/m9/shell.tsx"), /<ActiveSessions/);
});

test("locked shell numbers and New stays a quiet leader menu", () => {
  assert.equal(M9_METRICS.radiusSm, 8);
  assert.equal(M9_METRICS.radiusMd, 12);
  assert.equal(M9_METRICS.radiusLg, 16);
  assert.equal(M9_METRICS.cardRadius, 16);
  assert.deepEqual([...M9_METRICS.retiredRadius], [14, 20]);
  assert.equal(M9_METRICS.stateMotionMs, 240);
  assert.equal(M9_METRICS.layoutMotionMs, 300);
  assert.equal(M9_METRICS.springs, false);
  assert.equal(M9_METRICS.discoverHeight, 48);
  assert.equal(M9_METRICS.discoverCircle, 44);
  assert.equal(M9_METRICS.discoverIcon, 20);
  assert.equal(M9_METRICS.navRowPx, 36);
  assert.equal(M9_METRICS.inputBorder, "#8A8478");
  const family = newMenu("family");
  const team = newMenu("team");
  assert.ok(family.length <= 6);
  assert.ok(team.length <= 6);
  assert.equal(family.some((item) => item.label === "Person in development"), true);
  assert.equal(family.some((item) => item.label === "Member invite"), false);
  assert.equal(team.some((item) => item.label === "Member invite"), true);
  assert.equal(team.some((item) => item.label === "Person in development"), false);
  assert.equal([...family, ...team].some((item) => item.id === "connect-ai"), false);
  const shell = read("src/components/m9/shell.tsx");
  assert.match(shell, /m9-new-row/);
  assert.doesNotMatch(shell, /\/metering|Credits|\/pricing/);
  const css = read("src/app/globals.css");
  assert.match(css, /width: 240px/);
  assert.match(css, /min-height: 36px/);
  assert.match(css, /--input: #8a8478/);
  assert.doesNotMatch(css, /--color-brand-orange|--color-brand-navy|--shadow-orange-glow/);
  assert.doesNotMatch(read("src/app/layout.tsx"), /Inter|Space_Grotesk/);
  assert.match(readFileSync(join(root, "../docs/staff/SHELLS.md"), "utf8"), /Issue 368 supersedes/);
});
