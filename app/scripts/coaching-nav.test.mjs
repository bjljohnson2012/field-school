import assert from "node:assert/strict";
import test from "node:test";
import { coachingNav, tasksCount } from "../src/lib/coaching/nav.ts";

const forbidden = ["/home", "/help", "/c/sales"];

test("learner with empty caps on sales and platformAdmin still gets Roster", () => {
  for (const orgKind of ["sales", "company"]) {
    const items = coachingNav({
      orgKind,
      capabilities: [],
      platformAdmin: true,
    });
    assert.ok(
      items.some((item) => item.label === "Roster" && item.href === "/roster" && !item.disabled),
      `${orgKind} platform admin sees Roster`,
    );
    assert.ok(items.some((item) => item.label === "Questions" && item.href === "/coaching/questions"));
    assert.ok(items.some((item) => item.label === "Users" && item.href === "/coaching/users"));
    assert.equal(
      items.some((item) => item.label === "Tasks" || item.href === "/tasks"),
      false,
    );
    for (const item of items) {
      assert.equal(forbidden.includes(item.href), false);
    }
    const products = items.find((item) => item.label === "Products");
    assert.equal(products?.disabled, true);
  }
});

test("sales learner without platformAdmin does not get Roster", () => {
  const items = coachingNav({
    orgKind: "sales",
    capabilities: [],
    platformAdmin: false,
  });
  assert.equal(items.some((item) => item.label === "Roster"), false);
  const course = items.find((item) => item.label === "Course");
  assert.equal(course?.href, "/o/sales/welcome");
  assert.equal(course?.disabled, false);
  assert.equal(items.find((item) => item.label === "Improve")?.disabled, true);
});

test("household home is the welcome lesson and tasks count stays 0", () => {
  const learner = coachingNav({
    orgKind: "homeschool",
    capabilities: ["learner"],
    platformAdmin: false,
  });
  assert.equal(learner.find((item) => item.label === "Home")?.href, "/o/household/welcome");
  assert.equal(learner.some((item) => item.href === "/roster"), false);
  assert.equal(tasksCount(), 0);
});
