import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

test("household org says child, not student, and lists parent-facing children", () => {
  const orgHome = readSrc("src/app/o/[slug]/page.tsx");
  const childrenApi = readSrc("src/app/api/children/route.ts");
  const dashboard = readSrc("src/app/dashboard/page.tsx");

  assert.match(orgHome, /Say child, not student/);
  assert.match(orgHome, /Kids have no own login/);
  assert.match(orgHome, /Parent-facing list/);
  assert.match(orgHome, /<h2 className="font-display text-2xl">Children<\/h2>/);
  assert.match(orgHome, /Add a child/);
  assert.match(orgHome, /method: "PATCH"/);
  assert.doesNotMatch(orgHome, /Student/);
  assert.doesNotMatch(orgHome, /street|neighborhood|Welcome home/i);

  assert.match(childrenApi, /export async function GET/);
  assert.match(childrenApi, /export async function PATCH/);
  assert.match(childrenApi, /objectId: "parent-note"/);
  assert.match(childrenApi, /login: "none"/);
  assert.match(childrenApi, /welcomeWatched/);
  assert.match(childrenApi, /patternTitle/);
  assert.doesNotMatch(childrenApi, /login: row\.email/);

  assert.match(dashboard, /Parent-facing list/);
  assert.match(dashboard, /Child · login none/);
  assert.doesNotMatch(dashboard, /say student|Student org/i);
});

test("logged-in / is the dashboard and marketing CTAs stay guest-only", () => {
  const home = readSrc("src/app/page.tsx");
  assert.match(home, /useSession/);
  assert.match(home, /if \(loggedIn\) router\.replace\("\/dashboard"\)/);
  assert.match(home, /if \(loggedIn\) return null/);
  const redirectIdx = home.indexOf('if (loggedIn) return null');
  const guestIdx = home.indexOf("Continue as guest");
  const betaIdx = home.indexOf("Join free beta");
  const adminIdx = home.indexOf('href="/admin"');
  const demoIdx = home.indexOf('href="/admin/demo"');
  assert.ok(redirectIdx >= 0 && guestIdx > redirectIdx);
  assert.ok(betaIdx > redirectIdx);
  assert.ok(adminIdx > redirectIdx);
  assert.ok(demoIdx > redirectIdx);
  assert.doesNotMatch(home, /Instant demo/);
});

test("admin start-here splits courses from assessments and shows progress", () => {
  const admin = readSrc("src/app/admin/page.tsx");
  assert.match(admin, /Start here/);
  assert.match(admin, /Do this first/);
  assert.match(admin, /Courses are lessons/);
  assert.match(admin, /<h2 className="font-display text-2xl tracking-tight">Courses<\/h2>/);
  assert.match(admin, /<h2 className="font-display text-2xl tracking-tight">Assessments<\/h2>/);
  assert.match(admin, /Field Pattern sits here/);
  assert.match(admin, /href="\/pattern"/);
  assert.match(admin, /<h2 className="font-display text-2xl tracking-tight">Progress<\/h2>/);
  assert.match(admin, /Open Inbox/);
  assert.match(admin, /Kids have no own login/);
  assert.doesNotMatch(admin, /First student org|Second student org/);
});

test("logged-in header hides About; Inbox lives only under Admin", () => {
  const header = readSrc("src/components/site-header.tsx");
  const nav = readSrc("src/components/admin-nav.tsx");
  const inbox = readSrc("src/app/inbox/page.tsx");
  const notices = readSrc("src/app/admin/notifications/page.tsx");
  const feedback = readSrc("src/components/course-feedback.tsx");

  assert.match(header, /loggedIn \? "\/dashboard" : "\/"/);
  assert.match(header, /!\s*loggedIn \? \[\{ href: "\/about"/);
  assert.doesNotMatch(header, /href: "\/inbox"/);
  assert.doesNotMatch(header, /Notifications/);
  assert.doesNotMatch(header, /label: "About".*loggedIn/);

  assert.match(nav, /href: "\/admin\/notifications", label: "Inbox"/);
  assert.doesNotMatch(nav, /label: "Notifications"/);

  assert.match(inbox, /router\.replace\(isStaff && !impersonating \? "\/admin\/notifications" : "\/dashboard"\)/);
  assert.match(notices, /<h1 className="mt-2 font-display text-4xl tracking-tight">\s*Inbox\s*<\/h1>/);
  assert.match(feedback, /Admin → Inbox/);
  assert.doesNotMatch(feedback, /Admin → Notifications/);
});

test("org switcher View all lists users and their org", () => {
  const picker = readSrc("src/components/org-picker.tsx");
  const peoplePage = readSrc("src/app/people/page.tsx");
  const peopleApi = readSrc("src/app/api/org/people/route.ts");

  assert.match(picker, /const VIEW_ALL = "__all__"/);
  assert.match(picker, /<option value=\{VIEW_ALL\}>View all<\/option>/);
  assert.match(picker, /router\.push\("\/people"\)/);

  assert.match(peoplePage, /View all/);
  assert.match(peoplePage, /which org they belong to/);
  assert.match(peoplePage, /<th className="px-4 py-3 font-medium">Org<\/th>/);
  assert.match(peoplePage, /person\.kind === "child" \? "Child" : "Adult"/);
  assert.match(peoplePage, /person\.kind === "child" \? "None" : "Member"/);

  assert.match(peopleApi, /child_cannot_list/);
  assert.match(peopleApi, /login: row\.kind === "child" \? "none" : "member"/);
  assert.match(peopleApi, /const people = staff/);
  assert.match(peopleApi, /rows\.filter\(\(row\) => row\.org === auth\.identity\.orgSlug\)/);
  assert.doesNotMatch(peopleApi, /email: row\.email/);
});
