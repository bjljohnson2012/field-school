import assert from "node:assert/strict";
import test from "node:test";
import { applyAssist, applyFactsAssist, assistDraft, assistFacts, brainBoard, chooseNextStep, readForTool, refreshFromUse, shapeBrain, updateOutcome } from "./model.ts";

const parent = { kind: "adult", stance: "guardian", org: "household", membershipId: "parent-1" };
const leader = { kind: "adult", stance: "trainer", org: "sales", membershipId: "leader-1" };

test("parent updates the child outcome and the child has no login", () => {
  const shaped = shapeBrain({
    orgId: "org-home",
    room: "household",
    facts: "The household is learning at home.",
    actorId: "parent-1",
    people: [
      {
        membershipId: "child-1",
        name: "Ada",
        kind: "child",
        login: "none",
        profile: "Who they are now",
        outcomes: "Keep the next step",
      },
    ],
  });
  assert.equal(shaped.ok, true);
  if (!shaped.ok) return;
  assert.equal(shaped.brain.people[0].login, "none");
  assert.equal(shaped.brain.people[0].ownsOutcomes, false);
  const childWrite = updateOutcome(shaped.brain, { ...parent, kind: "child", membershipId: "child-1" }, "child-1", "A login");
  assert.deepEqual(childWrite, { ok: false, error: "child_has_no_login" });
  const updated = updateOutcome(shaped.brain, parent, "child-1", "The next step still shows");
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  assert.equal(updated.brain.people[0].outcomes, "The next step still shows");
  assert.equal(updated.brain.people[0].ownsOutcomes, false);
  const tool = readForTool(updated.brain, "org-home");
  assert.equal(tool?.facts, "The household is learning at home.");
  assert.equal(tool?.people[0].outcomes, "The next step still shows");
  assert.equal(readForTool(updated.brain, "org-sales"), null);
});

test("leader owns sales outcomes and the sales brain has no children", () => {
  const blocked = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "The team keeps moving.",
    actorId: "leader-1",
    people: [
      {
        membershipId: "child-1",
        name: "Wrong room",
        kind: "child",
        login: "none",
        profile: "no",
        outcomes: "no",
      },
    ],
  });
  assert.deepEqual(blocked, { ok: false, error: "sales_has_no_children" });
  const shaped = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "The team keeps moving.",
    actorId: "leader-1",
    people: [
      {
        membershipId: "rep-1",
        name: "Kai",
        kind: "adult",
        login: "member",
        profile: "Who they are now",
        outcomes: "Name the next step",
      },
    ],
  });
  assert.equal(shaped.ok, true);
  if (!shaped.ok) return;
  assert.equal(shaped.brain.people[0].login, "member");
  assert.equal(shaped.brain.people[0].ownsOutcomes, false);
  const updated = updateOutcome(shaped.brain, leader, "rep-1", "The next step stays");
  assert.equal(updated.ok, true);
  if (!updated.ok) return;
  const tool = readForTool(updated.brain, "org-sales");
  assert.equal(tool?.people.length, 1);
  assert.equal(tool?.people[0].outcomes, "The next step stays");
  assert.equal(tool?.people[0].ownsOutcomes, false);
  assert.equal(tool?.people.some((person) => person.login === "none"), false);
});

test("desks use brain outcomes for the next step in both rooms", () => {
  const home = shapeBrain({
    orgId: "org-home",
    room: "household",
    facts: "Home facts",
    actorId: "parent-1",
    people: [
      {
        membershipId: "child-1",
        name: "Ada",
        kind: "child",
        login: "none",
        profile: "Who they are now",
        outcomes: "Keep the home next step",
      },
    ],
  });
  assert.equal(home.ok, true);
  if (!home.ok) return;
  const homeNext = chooseNextStep({
    room: "household",
    brain: home.brain,
    storedTitle: "Stored unit",
    membershipId: "child-1",
  });
  assert.equal(homeNext?.title, "Keep the home next step");
  assert.equal(homeNext?.from, "outcomes");
  assert.equal(homeNext?.login, "none");
  assert.equal(homeNext?.ownsOutcomes, false);

  const sales = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "Team facts",
    actorId: "leader-1",
    people: [
      {
        membershipId: "rep-1",
        name: "Kai",
        kind: "adult",
        login: "member",
        profile: "Who they are now",
        outcomes: "Keep the team next step",
      },
    ],
  });
  assert.equal(sales.ok, true);
  if (!sales.ok) return;
  const salesNext = chooseNextStep({
    room: "sales",
    brain: sales.brain,
    storedTitle: "Stored unit",
    membershipId: "rep-1",
  });
  assert.equal(salesNext?.title, "Keep the team next step");
  assert.equal(salesNext?.from, "outcomes");
  assert.equal(salesNext?.login, "member");
  assert.equal(salesNext?.ownsOutcomes, false);
  const withChild = {
    ...sales.brain,
    people: [
      ...sales.brain.people,
      {
        membershipId: "child-9",
        name: "Wrong room",
        kind: "child",
        login: "none",
        profile: "no",
        outcomes: "no",
        ownsOutcomes: false,
      },
    ],
  };
  const filtered = chooseNextStep({ room: "sales", brain: withChild, storedTitle: "Stored unit" });
  assert.equal(filtered?.membershipId, "rep-1");
  assert.notEqual(filtered?.login, "none");
});

test("real use refreshes the next step in both rooms", () => {
  const home = shapeBrain({
    orgId: "org-home",
    room: "household",
    facts: "Old home fact",
    actorId: "parent-1",
    people: [
      {
        membershipId: "child-1",
        name: "Ada",
        kind: "child",
        login: "none",
        profile: "Old profile",
        outcomes: "Old home step",
      },
    ],
  });
  assert.equal(home.ok, true);
  if (!home.ok) return;
  const taught = refreshFromUse(home.brain, parent, {
    kind: "teach",
    membershipId: "child-1",
    name: "Ada",
    personKind: "child",
    login: "none",
    step: "The portion after teach",
  });
  assert.equal(taught.ok, true);
  if (!taught.ok) return;
  assert.equal(taught.brain.people[0].outcomes, "The portion after teach");
  assert.equal(taught.brain.people[0].login, "none");
  assert.equal(taught.brain.people[0].ownsOutcomes, false);
  assert.match(taught.brain.people[0].profile, /Taught/);
  assert.match(taught.brain.facts, /Ada/);
  const homeNext = chooseNextStep({
    room: "household",
    brain: taught.brain,
    storedTitle: "Old stored unit",
    membershipId: "child-1",
  });
  assert.equal(homeNext?.title, "The portion after teach");
  assert.equal(homeNext?.from, "outcomes");
  assert.equal(homeNext?.login, "none");
  const childActor = refreshFromUse(
    home.brain,
    { ...parent, kind: "child", membershipId: "child-1" },
    {
      kind: "learn",
      membershipId: "child-1",
      name: "Ada",
      personKind: "child",
      login: "none",
      step: "A login",
    },
  );
  assert.deepEqual(childActor, { ok: false, error: "child_has_no_login" });
  const assigned = refreshFromUse(taught.brain, parent, {
    kind: "assign",
    membershipId: "child-1",
    name: "Ada",
    personKind: "child",
    login: "none",
    step: "The assigned portion",
  });
  assert.equal(assigned.ok, true);
  if (!assigned.ok) return;
  assert.equal(assigned.brain.people[0].outcomes, "The assigned portion");
  assert.match(assigned.brain.people[0].profile, /Assigned/);

  const sales = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "Old team fact",
    actorId: "leader-1",
    people: [
      {
        membershipId: "rep-1",
        name: "Kai",
        kind: "adult",
        login: "member",
        profile: "Old profile",
        outcomes: "Old team step",
      },
    ],
  });
  assert.equal(sales.ok, true);
  if (!sales.ok) return;
  const member = { kind: "adult", stance: "learner", org: "sales", membershipId: "rep-1" };
  const learned = refreshFromUse(sales.brain, member, {
    kind: "learn",
    membershipId: "rep-1",
    name: "Kai",
    personKind: "adult",
    login: "member",
    step: "The step after the session",
  });
  assert.equal(learned.ok, true);
  if (!learned.ok) return;
  assert.equal(learned.brain.people[0].login, "member");
  assert.equal(learned.brain.people[0].ownsOutcomes, false);
  assert.match(learned.brain.people[0].profile, /Learned/);
  assert.match(learned.brain.facts, /Kai/);
  const salesNext = chooseNextStep({
    room: "sales",
    brain: learned.brain,
    storedTitle: "Old stored unit",
    membershipId: "rep-1",
  });
  assert.equal(salesNext?.title, "The step after the session");
  assert.equal(salesNext?.from, "outcomes");
  assert.equal(salesNext?.login, "member");
  const progressed = refreshFromUse(learned.brain, leader, {
    kind: "progress",
    membershipId: "rep-1",
    name: "Kai",
    personKind: "adult",
    login: "member",
    step: "The step after progress",
  });
  assert.equal(progressed.ok, true);
  if (!progressed.ok) return;
  assert.equal(progressed.brain.people[0].outcomes, "The step after progress");
  assert.equal(progressed.brain.people[0].ownsOutcomes, false);
  assert.match(progressed.brain.people[0].profile, /Progress saved/);
  const blocked = refreshFromUse(sales.brain, leader, {
    kind: "progress",
    membershipId: "child-9",
    name: "Wrong room",
    personKind: "child",
    login: "none",
    step: "no",
  });
  assert.deepEqual(blocked, { ok: false, error: "sales_has_no_children" });
  const withChild = refreshFromUse(
    {
      ...sales.brain,
      people: [
        ...sales.brain.people,
        {
          membershipId: "child-9",
          name: "Wrong room",
          kind: "child",
          login: "none",
          profile: "no",
          outcomes: "no",
          ownsOutcomes: false,
        },
      ],
    },
    leader,
    {
      kind: "assign",
      membershipId: "rep-1",
      name: "Kai",
      personKind: "adult",
      login: "member",
      step: "Team step only",
    },
  );
  assert.equal(withChild.ok, true);
  if (!withChild.ok) return;
  assert.equal(withChild.brain.people.some((person) => person.kind === "child"), false);
  assert.equal(withChild.brain.people[0].outcomes, "Team step only");
});

test("insights lists org facts and many people in both rooms", () => {
  const home = shapeBrain({
    orgId: "org-home",
    room: "household",
    facts: "The household is learning at home.",
    actorId: "parent-1",
    people: [
      {
        membershipId: "child-2",
        name: "Bea",
        kind: "child",
        login: "none",
        profile: "Reads in the morning",
        outcomes: "Finish the next page",
      },
      {
        membershipId: "child-1",
        name: "Ada",
        kind: "child",
        login: "none",
        profile: "Who they are now",
        outcomes: "Keep the home next step",
      },
    ],
  });
  assert.equal(home.ok, true);
  if (!home.ok) return;
  const homeWithAdult = {
    ...home.brain,
    people: [
      ...home.brain.people,
      {
        membershipId: "adult-9",
        name: "Pat",
        kind: "adult",
        login: "member",
        profile: "Parent",
        outcomes: "Owns the path",
        ownsOutcomes: false,
      },
    ],
  };
  const homeBoard = brainBoard({ room: "household", brain: homeWithAdult });
  assert.equal(homeBoard.facts, "The household is learning at home.");
  assert.deepEqual(
    homeBoard.people.map((person) => person.name),
    ["Ada", "Bea"],
  );
  assert.equal(homeBoard.people.every((person) => person.login === "none"), true);
  assert.equal(homeBoard.people.every((person) => person.ownsOutcomes === false), true);
  assert.equal(homeBoard.people[0].profile, "Who they are now");
  assert.equal(homeBoard.people[0].outcomes, "Keep the home next step");
  assert.equal(homeBoard.people.some((person) => person.kind !== "child"), false);

  const sales = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "The team keeps moving.",
    actorId: "leader-1",
    people: [
      {
        membershipId: "rep-2",
        name: "Noor",
        kind: "adult",
        login: "member",
        profile: "Works the afternoon desk",
        outcomes: "Name the next call",
      },
      {
        membershipId: "rep-1",
        name: "Kai",
        kind: "adult",
        login: "member",
        profile: "Who they are now",
        outcomes: "Keep the team next step",
      },
    ],
  });
  assert.equal(sales.ok, true);
  if (!sales.ok) return;
  const salesWithChild = {
    ...sales.brain,
    people: [
      ...sales.brain.people,
      {
        membershipId: "child-9",
        name: "Wrong room",
        kind: "child",
        login: "none",
        profile: "no",
        outcomes: "no",
        ownsOutcomes: false,
      },
    ],
  };
  const salesBoard = brainBoard({ room: "sales", brain: salesWithChild });
  assert.equal(salesBoard.facts, "The team keeps moving.");
  assert.deepEqual(
    salesBoard.people.map((person) => person.name),
    ["Kai", "Noor"],
  );
  assert.equal(salesBoard.people.every((person) => person.login === "member"), true);
  assert.equal(salesBoard.people.every((person) => person.ownsOutcomes === false), true);
  assert.equal(salesBoard.people.some((person) => person.kind === "child" || person.login === "none"), false);
  assert.equal(salesBoard.people[1].profile, "Works the afternoon desk");
  assert.equal(salesBoard.people[1].outcomes, "Name the next call");
  const tool = readForTool(sales.brain, "org-sales");
  const fromTool = brainBoard({ room: "sales", brain: tool });
  assert.equal(fromTool.people.length, 2);
  assert.equal(fromTool.facts, tool?.facts);
});

test("assist keeps profile and outcomes current in both rooms", () => {
  const home = shapeBrain({
    orgId: "org-home",
    room: "household",
    facts: "Home reading",
    actorId: "parent-1",
    people: [
      {
        membershipId: "child-1",
        name: "Ada",
        kind: "child",
        login: "none",
        profile: "Taught. Next step is Old page.",
        outcomes: "Old page",
      },
      {
        membershipId: "child-2",
        name: "Bea",
        kind: "child",
        login: "none",
        profile: "Reads every morning before chores.",
        outcomes: "Stay with the morning reading",
      },
    ],
  });
  assert.equal(home.ok, true);
  if (!home.ok) return;
  const ada = home.brain.people[0];
  const suggested = assistDraft({
    room: "household",
    person: ada,
    facts: home.brain.facts,
    context: { pathTitle: "Home reading", nextStep: "Finish the next page" },
  });
  assert.equal(suggested.ok, true);
  if (!suggested.ok) return;
  assert.equal(suggested.draft.changed, true);
  assert.match(suggested.draft.profile, /Ada/);
  assert.match(suggested.draft.profile, /Home reading/);
  assert.equal(suggested.draft.outcomes, "Finish the next page");
  const saved = applyAssist(home.brain, parent, "child-1", {
    pathTitle: "Home reading",
    nextStep: "Finish the next page",
  });
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.brain.people[0].login, "none");
  assert.equal(saved.brain.people[0].ownsOutcomes, false);
  assert.equal(saved.brain.people[0].outcomes, "Finish the next page");
  assert.match(saved.brain.people[0].profile, /Home reading/);
  const bea = saved.brain.people.find((person) => person.membershipId === "child-2");
  const kept = assistDraft({
    room: "household",
    person: bea,
    facts: saved.brain.facts,
    context: { nextStep: "Stay with the morning reading" },
  });
  assert.equal(kept.ok, true);
  if (!kept.ok) return;
  assert.equal(kept.draft.changed, false);
  assert.equal(kept.draft.profile, "Reads every morning before chores.");
  const childWrite = applyAssist(home.brain, { ...parent, kind: "child", membershipId: "child-1" }, "child-1", {
    nextStep: "A login",
  });
  assert.deepEqual(childWrite, { ok: false, error: "child_has_no_login" });

  const sales = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "Afternoon desk",
    actorId: "leader-1",
    people: [
      {
        membershipId: "rep-1",
        name: "Kai",
        kind: "adult",
        login: "member",
        profile: "Learned. Next step is Old call.",
        outcomes: "Old call",
      },
    ],
  });
  assert.equal(sales.ok, true);
  if (!sales.ok) return;
  const withChild = {
    ...sales.brain,
    people: [
      ...sales.brain.people,
      {
        membershipId: "child-9",
        name: "Wrong room",
        kind: "child",
        login: "none",
        profile: "no",
        outcomes: "no",
        ownsOutcomes: false,
      },
    ],
  };
  const member = { kind: "adult", stance: "learner", org: "sales", membershipId: "rep-1" };
  const memberWrite = applyAssist(sales.brain, member, "rep-1", { nextStep: "Name the next call" });
  assert.deepEqual(memberWrite, { ok: false, error: "not_leader" });
  const blocked = applyAssist(withChild, leader, "child-9", { nextStep: "no" });
  assert.deepEqual(blocked, { ok: false, error: "sales_has_no_children" });
  const led = applyAssist(withChild, leader, "rep-1", {
    pathTitle: "Afternoon desk",
    nextStep: "Name the next call",
  });
  assert.equal(led.ok, true);
  if (!led.ok) return;
  assert.equal(led.brain.people.some((person) => person.kind === "child"), false);
  assert.equal(led.brain.people[0].login, "member");
  assert.equal(led.brain.people[0].ownsOutcomes, false);
  assert.equal(led.brain.people[0].outcomes, "Name the next call");
  assert.match(led.brain.people[0].profile, /Kai/);
  assert.match(led.brain.people[0].profile, /Afternoon desk/);
});

test("org facts name every next step in both rooms", () => {
  const home = shapeBrain({
    orgId: "org-home",
    room: "household",
    facts: "Ada: Old page.",
    actorId: "parent-1",
    people: [
      {
        membershipId: "child-2",
        name: "Bea",
        kind: "child",
        login: "none",
        profile: "Reads in the morning",
        outcomes: "Stay with the morning reading",
      },
      {
        membershipId: "child-1",
        name: "Ada",
        kind: "child",
        login: "none",
        profile: "Who they are now",
        outcomes: "Finish the next page",
      },
    ],
  });
  assert.equal(home.ok, true);
  if (!home.ok) return;
  const homeWithAdult = {
    ...home.brain,
    people: [
      ...home.brain.people,
      {
        membershipId: "adult-9",
        name: "Pat",
        kind: "adult",
        login: "member",
        profile: "Parent",
        outcomes: "Owns the path",
        ownsOutcomes: false,
      },
    ],
  };
  const homeSuggest = assistFacts(homeWithAdult);
  assert.equal(homeSuggest.ok, true);
  if (!homeSuggest.ok) return;
  assert.equal(homeSuggest.changed, true);
  assert.equal(homeSuggest.facts, "Ada: Finish the next page. Bea: Stay with the morning reading.");
  assert.equal(homeSuggest.facts.includes("Pat"), false);
  const homeSaved = applyFactsAssist(homeWithAdult, parent);
  assert.equal(homeSaved.ok, true);
  if (!homeSaved.ok) return;
  assert.equal(homeSaved.brain.facts, homeSuggest.facts);
  assert.equal(homeSaved.brain.people.every((person) => person.login === "none" || person.kind !== "child"), true);
  assert.equal(homeSaved.brain.people.filter((person) => person.kind === "child").every((person) => person.ownsOutcomes === false), true);
  const childWrite = applyFactsAssist(home.brain, { ...parent, kind: "child", membershipId: "child-1" });
  assert.deepEqual(childWrite, { ok: false, error: "child_has_no_login" });
  const taught = refreshFromUse(home.brain, parent, {
    kind: "teach",
    membershipId: "child-1",
    name: "Ada",
    personKind: "child",
    login: "none",
    step: "The portion after teach",
  });
  assert.equal(taught.ok, true);
  if (!taught.ok) return;
  assert.match(taught.brain.facts, /Ada: The portion after teach/);
  assert.match(taught.brain.facts, /Bea: Stay with the morning reading/);

  const sales = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "Kai: Old call.",
    actorId: "leader-1",
    people: [
      {
        membershipId: "rep-2",
        name: "Noor",
        kind: "adult",
        login: "member",
        profile: "Works the afternoon desk",
        outcomes: "Name the next call",
      },
      {
        membershipId: "rep-1",
        name: "Kai",
        kind: "adult",
        login: "member",
        profile: "Who they are now",
        outcomes: "Keep the team next step",
      },
    ],
  });
  assert.equal(sales.ok, true);
  if (!sales.ok) return;
  const salesWithChild = {
    ...sales.brain,
    people: [
      ...sales.brain.people,
      {
        membershipId: "child-9",
        name: "Wrong room",
        kind: "child",
        login: "none",
        profile: "no",
        outcomes: "Do not show",
        ownsOutcomes: false,
      },
    ],
  };
  const salesSuggest = assistFacts(salesWithChild);
  assert.equal(salesSuggest.ok, true);
  if (!salesSuggest.ok) return;
  assert.equal(salesSuggest.facts, "Kai: Keep the team next step. Noor: Name the next call.");
  assert.equal(salesSuggest.facts.includes("Wrong room"), false);
  const member = { kind: "adult", stance: "learner", org: "sales", membershipId: "rep-1" };
  assert.deepEqual(applyFactsAssist(sales.brain, member), { ok: false, error: "not_leader" });
  const salesSaved = applyFactsAssist(salesWithChild, leader);
  assert.equal(salesSaved.ok, true);
  if (!salesSaved.ok) return;
  assert.equal(salesSaved.brain.facts, salesSuggest.facts);
  assert.equal(salesSaved.brain.people.some((person) => person.kind === "child" || person.login === "none"), false);
  assert.equal(salesSaved.brain.people.every((person) => person.ownsOutcomes === false && person.login === "member"), true);
});

test("a person's suggestion stays about that person in both rooms", () => {
  const homeFacts = "Ada: Finish the next page. Bea: Stay with the morning reading.";
  const home = shapeBrain({
    orgId: "org-home",
    room: "household",
    facts: homeFacts,
    actorId: "parent-1",
    people: [
      {
        membershipId: "child-1",
        name: "Ada",
        kind: "child",
        login: "none",
        profile: "Taught. Next step is Old page.",
        outcomes: "Finish the next page",
      },
      {
        membershipId: "child-2",
        name: "Bea",
        kind: "child",
        login: "none",
        profile: "Learned. Next step is Old page.",
        outcomes: "Stay with the morning reading",
      },
    ],
  });
  assert.equal(home.ok, true);
  if (!home.ok) return;
  const ada = assistDraft({
    room: "household",
    person: home.brain.people[0],
    facts: homeFacts,
    context: { pathTitle: homeFacts, nextStep: "Finish the next page" },
  });
  assert.equal(ada.ok, true);
  if (!ada.ok) return;
  assert.equal(ada.draft.profile, "Ada. Next step is Finish the next page.");
  assert.equal(ada.draft.profile.includes("Bea"), false);
  assert.equal(ada.draft.outcomes, "Finish the next page");
  const saved = applyAssist(home.brain, parent, "child-1", { pathTitle: homeFacts, nextStep: "Finish the next page" });
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.brain.people[0].login, "none");
  assert.equal(saved.brain.people[0].ownsOutcomes, false);
  assert.equal(saved.brain.people[0].profile.includes("Bea"), false);
  const childWrite = applyAssist(home.brain, { ...parent, kind: "child", membershipId: "child-1" }, "child-1", {
    pathTitle: homeFacts,
  });
  assert.deepEqual(childWrite, { ok: false, error: "child_has_no_login" });

  const salesFacts = "Kai: Keep the team next step. Noor: Name the next call.";
  const sales = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: salesFacts,
    actorId: "leader-1",
    people: [
      {
        membershipId: "rep-1",
        name: "Kai",
        kind: "adult",
        login: "member",
        profile: "Taught. Next step is Old call.",
        outcomes: "Keep the team next step",
      },
      {
        membershipId: "rep-2",
        name: "Noor",
        kind: "adult",
        login: "member",
        profile: "Learned. Next step is Old call.",
        outcomes: "Name the next call",
      },
    ],
  });
  assert.equal(sales.ok, true);
  if (!sales.ok) return;
  const withChild = {
    ...sales.brain,
    people: [
      ...sales.brain.people,
      {
        membershipId: "child-9",
        name: "Wrong room",
        kind: "child",
        login: "none",
        profile: "no",
        outcomes: "Do not show",
        ownsOutcomes: false,
      },
    ],
  };
  const kai = assistDraft({
    room: "sales",
    person: sales.brain.people[0],
    facts: salesFacts,
    context: { pathTitle: salesFacts, nextStep: "Keep the team next step" },
  });
  assert.equal(kai.ok, true);
  if (!kai.ok) return;
  assert.equal(kai.draft.profile, "Kai. Next step is Keep the team next step.");
  assert.equal(kai.draft.profile.includes("Noor"), false);
  assert.equal(kai.draft.profile.includes("Wrong room"), false);
  const blocked = assistDraft({
    room: "sales",
    person: withChild.people[2],
    facts: salesFacts,
    context: { pathTitle: salesFacts, nextStep: "Do not show" },
  });
  assert.deepEqual(blocked, { ok: false, error: "sales_has_no_children" });
  const member = { kind: "adult", stance: "learner", org: "sales", membershipId: "rep-1" };
  assert.deepEqual(applyAssist(sales.brain, member, "rep-1", { pathTitle: salesFacts }), { ok: false, error: "not_leader" });
  const led = applyAssist(withChild, leader, "rep-1", { pathTitle: salesFacts, nextStep: "Keep the team next step" });
  assert.equal(led.ok, true);
  if (!led.ok) return;
  assert.equal(led.brain.people.some((person) => person.kind === "child"), false);
  assert.equal(led.brain.people[0].login, "member");
  assert.equal(led.brain.people[0].ownsOutcomes, false);
  assert.equal(led.brain.people[0].profile.includes("Noor"), false);
});

test("saving a suggestion refreshes org facts in both rooms", () => {
  const home = shapeBrain({
    orgId: "org-home",
    room: "household",
    facts: "Ada: Old page.",
    actorId: "parent-1",
    people: [
      {
        membershipId: "child-1",
        name: "Ada",
        kind: "child",
        login: "none",
        profile: "Taught. Next step is Old page.",
        outcomes: "Old page",
      },
      {
        membershipId: "child-2",
        name: "Bea",
        kind: "child",
        login: "none",
        profile: "Reads every morning before chores.",
        outcomes: "Stay with the morning reading",
      },
    ],
  });
  assert.equal(home.ok, true);
  if (!home.ok) return;
  const saved = applyAssist(home.brain, parent, "child-1", { nextStep: "Finish the next page" });
  assert.equal(saved.ok, true);
  if (!saved.ok) return;
  assert.equal(saved.brain.facts, "Ada: Finish the next page. Bea: Stay with the morning reading.");
  assert.equal(saved.brain.people[0].login, "none");
  assert.equal(saved.brain.people.every((person) => person.ownsOutcomes === false), true);
  assert.equal(saved.brain.facts.includes("Pat"), false);
  const childWrite = applyAssist(home.brain, { ...parent, kind: "child", membershipId: "child-1" }, "child-1", {
    nextStep: "A login",
  });
  assert.deepEqual(childWrite, { ok: false, error: "child_has_no_login" });

  const sales = shapeBrain({
    orgId: "org-sales",
    room: "sales",
    facts: "Kai: Old call.",
    actorId: "leader-1",
    people: [
      {
        membershipId: "rep-1",
        name: "Kai",
        kind: "adult",
        login: "member",
        profile: "Taught. Next step is Old call.",
        outcomes: "Old call",
      },
      {
        membershipId: "rep-2",
        name: "Noor",
        kind: "adult",
        login: "member",
        profile: "Works the afternoon desk",
        outcomes: "Name the next call",
      },
    ],
  });
  assert.equal(sales.ok, true);
  if (!sales.ok) return;
  const withChild = {
    ...sales.brain,
    people: [
      ...sales.brain.people,
      {
        membershipId: "child-9",
        name: "Wrong room",
        kind: "child",
        login: "none",
        profile: "no",
        outcomes: "Do not show",
        ownsOutcomes: false,
      },
    ],
  };
  const member = { kind: "adult", stance: "learner", org: "sales", membershipId: "rep-1" };
  assert.deepEqual(applyAssist(sales.brain, member, "rep-1", { nextStep: "Keep the team next step" }), {
    ok: false,
    error: "not_leader",
  });
  const led = applyAssist(withChild, leader, "rep-1", { nextStep: "Keep the team next step" });
  assert.equal(led.ok, true);
  if (!led.ok) return;
  assert.equal(led.brain.facts, "Kai: Keep the team next step. Noor: Name the next call.");
  assert.equal(led.brain.facts.includes("Wrong room"), false);
  assert.equal(led.brain.facts.includes("Do not show"), false);
  assert.equal(led.brain.people.some((person) => person.kind === "child" || person.login === "none"), false);
  assert.equal(led.brain.people.every((person) => person.ownsOutcomes === false && person.login === "member"), true);
});
