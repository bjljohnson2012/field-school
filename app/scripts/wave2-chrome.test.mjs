import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const readSrc = (rel) => readFileSync(join(root, rel), "utf8");

test("household org says child, not student, and lists parent-facing children", () => {
  const orgHome = readSrc("src/app/o/[slug]/page.tsx");
  const childrenDb = readSrc("src/components/children-database.tsx");
  const childrenPage = readSrc("src/app/children/page.tsx");
  const childrenApi = readSrc("src/app/api/children/route.ts");
  const dashboard = readSrc("src/app/dashboard/page.tsx");

  assert.match(orgHome, /<ChildrenDatabase/);
  assert.match(orgHome, /Children database/);
  assert.doesNotMatch(orgHome, /Student/);
  assert.doesNotMatch(orgHome, /street|neighborhood|Welcome home/i);

  assert.match(childrenDb, /Say child, not student/);
  assert.match(childrenDb, /Kids have no own login/);
  assert.match(childrenDb, /Parent-facing children\/subusers database/);
  assert.match(childrenDb, /<h2 className="font-display text-2xl">\{heading\}<\/h2>/);
  assert.match(childrenDb, /Add a child/);
  assert.match(childrenDb, /method: "PATCH"/);
  assert.match(childrenDb, /Lock profile/);
  assert.match(childrenDb, /\/api\/pattern\/lock/);
  assert.doesNotMatch(childrenDb, /Student/);

  assert.match(childrenPage, /Parent-facing children\/subusers database/);
  assert.match(childrenPage, /<ChildrenDatabase/);

  assert.match(childrenApi, /export async function GET/);
  assert.match(childrenApi, /export async function PATCH/);
  assert.match(childrenApi, /objectId: "parent-note"/);
  assert.match(childrenApi, /login: "none"/);
  assert.match(childrenApi, /welcomeWatched/);
  assert.match(childrenApi, /patternTitle/);
  assert.match(childrenApi, /locked: Boolean\(profile\?\.locked\)/);
  assert.doesNotMatch(childrenApi, /login: row\.email/);

  assert.match(dashboard, /Parent-facing children\/subusers database/);
  assert.match(dashboard, /Child · login none/);
  assert.match(dashboard, /!signedIn && !session/);
  assert.match(dashboard, /signedIn/);
  assert.doesNotMatch(dashboard, /Continue as guest/);
  assert.doesNotMatch(dashboard, /Run the student demo/);
  assert.doesNotMatch(dashboard, /say student|Student org/i);
});

test("logged-in / is the dashboard and marketing CTAs stay guest-only", () => {
  const page = readSrc("src/app/page.tsx");
  const home = readSrc("src/app/campus-home.tsx");
  assert.match(page, /const session = await auth\(\)/);
  assert.match(page, /if \(session\?\.user\?\.email\) redirect\("\/dashboard"\)/);
  assert.match(page, /return <CampusHome \/>/);
  assert.match(home, /Continue as guest/);
  assert.match(home, /Join free beta/);
  const guestIdx = home.indexOf("Continue as guest");
  const betaIdx = home.indexOf("Join free beta");
  const gateIdx = home.indexOf("ready && isStaff");
  const adminIdx = home.indexOf('href="/admin"');
  const demoIdx = home.indexOf('href="/admin/demo"');
  assert.ok(guestIdx >= 0 && betaIdx >= 0);
  assert.ok(gateIdx >= 0 && adminIdx > gateIdx);
  assert.ok(demoIdx > gateIdx);
  assert.doesNotMatch(home, /Instant demo/);
  assert.doesNotMatch(page, /Instant demo/);
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
  assert.match(admin, /Household children/);
  assert.match(admin, /Field Pattern/);
  assert.match(admin, /Access requests/);
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

  assert.match(header, /guestChrome \? "\/" : "\/dashboard"/);
  assert.match(header, /status === "unauthenticated"/);
  assert.match(header, /showAbout \? \[\{ href: "\/about"/);
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
  assert.match(peopleApi, /allowedOrgs\.has\(row\.org\)/);
  assert.match(peopleApi, /auth\.memberships\.map/);
  assert.doesNotMatch(peopleApi, /email: row\.email/);
});

test("campus UI retires gym wording and names the child subset from the table", () => {
  const docs = readSrc("src/app/docs/api/page.tsx");
  const pattern = readSrc("src/app/pattern/page.tsx");
  assert.doesNotMatch(docs, /gym/i);
  assert.match(docs, /operator catalog events/);
  assert.match(docs, /sales/);
  assert.doesNotMatch(pattern, /twenty-item/);
  assert.match(pattern, /child subset from the pinned fp-50-v1/);
});
