import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  accountItems,
  filterCommands,
  parseShellViewer,
  shellCommands,
} from "../src/lib/shell/model.ts";
import { activeDoor, learnZone, matchRoute } from "../src/lib/shell/routes.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

const KID = "11111111-1111-4111-8111-111111111111";

function viewer(org, extra = {}) {
  return {
    name: "Ada",
    memberKind: "adult",
    org,
    orgName: org,
    stance: "guardian",
    platformAdmin: false,
    logoUrl: "",
    memberships: [],
    profiles: [{ membershipId: KID, displayName: "Robin" }],
    ...extra,
  };
}

const LEADER_BAR = [
  { href: "/dashboard", label: "Learn" },
  { href: "/people", label: "People" },
  { href: "/o/sales/l", label: "Library" },
  { href: "/insights", label: "Insights" },
];
const NEW = [{ href: "/library/video", label: "Long-form video" }];

test("one shell host: the root layout mounts AppShell and nothing else draws a bar", () => {
  const layout = read("src/app/layout.tsx");
  assert.match(layout, /<AppShell>\{children\}<\/AppShell>/);
  assert.doesNotMatch(layout, /coachingShellEnabled|data-chrome/);
  const shell = read("src/components/app-shell.tsx");
  assert.match(shell, /<SiteHeader viewer=\{viewer\} \/>/);
  assert.match(shell, /<CommandPalette commands=\{commands\} \/>/);
  assert.equal(shell.includes("<header"), false);
  assert.doesNotMatch(read("src/app/login/login-form.tsx"), /coachingShell|CoachMark/);
  const header = read("src/components/site-header.tsx");
  assert.match(header, /<header data-bar=""/);
  assert.match(header, /useBarMenusClose\(pathname\);/);
  assert.match(header, /loggedIn && !viewer\s*\?\s*\[\]/);
  assert.match(header, /header\[data-bar\] details\[open\]/);
  assert.match(header, /window\.addEventListener\(OPEN_PALETTE_EVENT, onPalette\)/);
});

test("household adults see their tracked children; sales sees card and tasks; never both", () => {
  const home = accountItems(viewer("household"));
  assert.deepEqual(
    home.map((item) => item.href),
    [`/profile/kids/${KID}`, "/account"],
  );
  assert.equal(home[0].label, "Robin · child profile");

  const sales = accountItems(viewer("sales"));
  assert.deepEqual(
    sales.map((item) => item.href),
    ["/card", "/tasks", "/account"],
  );
  assert.equal(sales.some((item) => item.href.startsWith("/profile/kids/")), false);

  assert.deepEqual(accountItems(viewer("household", { memberKind: "child" })).map((item) => item.href), ["/account"]);
  assert.deepEqual(accountItems(viewer("")).map((item) => item.href), ["/account"]);
});

test("Cmd-K is derived from the bar, New, and the avatar menu, deduped by href", () => {
  for (const org of ["household", "sales"]) {
    const v = viewer(org);
    const commands = shellCommands({ bar: LEADER_BAR, newDoors: NEW, viewer: v });
    const hrefs = commands.map((item) => item.href);
    for (const door of [...LEADER_BAR, ...NEW, ...accountItems(v)]) assert.ok(hrefs.includes(door.href), `${org} ${door.href}`);
    assert.ok(hrefs.includes("/profile"));
    assert.equal(new Set(hrefs).size, hrefs.length);
  }
  const home = shellCommands({ bar: LEADER_BAR, newDoors: NEW, viewer: viewer("household") });
  const sales = shellCommands({ bar: LEADER_BAR, newDoors: NEW, viewer: viewer("sales") });
  assert.equal(home.some((item) => item.group === "Sales desk"), false);
  assert.ok(sales.some((item) => item.group === "Sales desk"));
  assert.equal(sales.some((item) => item.group === "Profiles"), false);
  assert.deepEqual(shellCommands({ bar: LEADER_BAR, newDoors: NEW, viewer: null }), []);
});

test("filterCommands needs every word in the label or the group", () => {
  const commands = shellCommands({ bar: LEADER_BAR, newDoors: NEW, viewer: viewer("household") });
  assert.deepEqual(filterCommands(commands, "robin").map((item) => item.href), [`/profile/kids/${KID}`]);
  assert.deepEqual(filterCommands(commands, "new video").map((item) => item.href), ["/library/video"]);
  assert.equal(filterCommands(commands, "").length, commands.length);
  assert.deepEqual(filterCommands(commands, "nothing here"), []);
  const wizard = shellCommands({
    bar: [],
    newDoors: [{ href: "/library/wizard", label: "Wizard", hint: "One branched flow" }],
    viewer: viewer("household"),
  });
  assert.deepEqual(filterCommands(wizard, "branched").map((item) => item.href), ["/library/wizard"]);
});

test("parseShellViewer reads /api/me without trusting its shape", () => {
  assert.equal(parseShellViewer(null), null);
  assert.equal(parseShellViewer({ authenticated: false, guest: true }), null);
  const parsed = parseShellViewer({
    authenticated: true,
    platformAdmin: true,
    logoUrl: 7,
    member: { name: "Ada", kind: "child" },
    activeOrg: { slug: "household", name: "Household", stance: "learner" },
    memberships: [{ org: "household", name: "Household", stance: "learner" }, { name: "no slug" }, "junk"],
    profiles: [{ membershipId: KID, displayName: "Robin" }, { displayName: "no id" }],
  });
  assert.deepEqual(parsed, {
    name: "Ada",
    memberKind: "child",
    org: "household",
    orgName: "Household",
    stance: "learner",
    platformAdmin: true,
    logoUrl: "",
    memberships: [{ org: "household", name: "Household", stance: "learner" }],
    profiles: [{ membershipId: KID, displayName: "Robin" }],
  });
  assert.equal(parseShellViewer({ authenticated: true })?.org, "");
});

test("Learn keeps desk, catalog, collection, and player apart", () => {
  assert.equal(learnZone("/dashboard"), "desk");
  assert.equal(learnZone("/c/grok-bot/desk"), "desk");
  assert.equal(learnZone("/c/grok-bot"), "collection");
  assert.equal(learnZone("/c/grok-bot/units"), "collection");
  assert.equal(learnZone("/c/grok-bot/s/3"), "player");
  assert.equal(learnZone("/c/grok-bot/exam"), "player");
  assert.equal(learnZone("/play/abc"), "player");
  assert.equal(learnZone("/o/sales/l"), "catalog");
  assert.equal(learnZone(`/o/sales/l/${KID}`), "player");
  assert.equal(learnZone("/insights"), null);
  assert.equal(matchRoute("/nowhere"), null);
});

test("the bar lights one door, and a learner on a Library player lights Learn", () => {
  const leader = ["learn", "people", "library", "insights"];
  const learner = ["learn", "me"];
  assert.equal(activeDoor("/people/abc", leader), "people");
  assert.equal(activeDoor("/brain", leader), "people");
  assert.equal(activeDoor("/o/household/l", leader), "library");
  assert.equal(activeDoor("/o/household/teach/new", leader), "library");
  assert.equal(activeDoor("/insights", leader), "insights");
  assert.equal(activeDoor(`/o/sales/l/${KID}`, learner), "learn");
  assert.equal(activeDoor("/skills", learner), "me");
  assert.equal(activeDoor("/insights", learner), null);
  assert.equal(activeDoor("/profile", leader), null);
});
