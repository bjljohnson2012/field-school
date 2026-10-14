import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { CHECKOUT_GO_LIVE } from "../src/lib/billing/checkout-destination.ts";
import { COACHING_GO_LIVE } from "../marketing-site/js/checkout-switch.mjs";
import { COLLECTIONS } from "../src/lib/evolution/collections.ts";
import {
  EVOLUTION_PROFILE_TABLE,
  SEALED_ADULT_PROFILE_STORE,
  appendProfileNote,
  applyEvolutionWrite,
  evolutionWriteHook,
  labelsMatchRegistry,
} from "../src/lib/evolution/write.ts";

const NOTE = "Wait for the answer before you pitch.";
const LONG = `${NOTE} Then ask one question.`;

function memory(rows) {
  const saves = [];
  const loads = [];
  const sealed = [];
  return {
    rows,
    saves,
    loads,
    sealed,
    async load(orgId, membershipId) {
      loads.push({ orgId, membershipId });
      return rows.find((row) => row.orgId === orgId && row.membershipId === membershipId) ?? null;
    },
    async saveNote(orgId, membershipId, profile) {
      saves.push({ orgId, membershipId, profile });
      const row = rows.find((item) => item.orgId === orgId && item.membershipId === membershipId);
      if (!row) throw new Error("save without a row");
      row.profile = profile;
    },
  };
}

const child = {
  orgId: "org-home",
  membershipId: "mem-child",
  kind: "child",
  login: "none",
  profile: "",
};

const learner = {
  orgId: "org-sales",
  membershipId: "mem-learner",
  kind: "adult",
  login: "member",
  profile: "Keeps the first line.",
};

test("labels stay Families, Profiles, Milestones, Media", () => {
  assert.equal(labelsMatchRegistry(), true);
  assert.deepEqual(
    COLLECTIONS.map((row) => row.label),
    ["Families", "Profiles", "Milestones", "Media"],
  );
  const hook = evolutionWriteHook({
    text: LONG,
    orgName: "Household",
    filename: "call-notes.pdf",
    kind: "file",
    subject: { kind: "child", login: "none" },
  });
  assert.equal(hook.ok, true);
  assert.equal(hook.subject, "Tracked child");
  assert.deepEqual(hook.labels, {
    families: "Families",
    profiles: "Profiles",
    milestones: "Milestones",
    media: "Media",
  });
  assert.equal(hook.note, NOTE);
  assert.equal(hook.persistMilestones, false);
  assert.equal(hook.persistMedia, false);
  assert.equal(hook.sealedAdultWrites, 0);
  assert.equal(hook.edgeScopeColumn, false);
});

test("a child is not a User and does not gain a login", async () => {
  const store = memory([{ ...child }]);
  const asUser = await applyEvolutionWrite(
    {
      orgId: child.orgId,
      membershipId: child.membershipId,
      text: LONG,
      subject: { kind: "user", login: "member" },
    },
    store,
  );
  assert.deepEqual(asUser, { ok: false, error: "child_is_not_a_user" });
  const asMember = await applyEvolutionWrite(
    {
      orgId: child.orgId,
      membershipId: child.membershipId,
      text: LONG,
      subject: { kind: "child", login: "member" },
    },
    store,
  );
  assert.deepEqual(asMember, { ok: false, error: "child_is_not_a_user" });
  assert.equal(store.loads.length, 0);
  assert.equal(store.saves.length, 0);
  assert.equal(store.rows[0].login, "none");
  assert.equal(store.rows[0].kind, "child");
  assert.equal(store.rows[0].profile, "");
});

test("HTML in a note is stored empty and does not change the profile", async () => {
  const store = memory([{ ...learner }]);
  const wrote = await applyEvolutionWrite(
    {
      orgId: learner.orgId,
      membershipId: learner.membershipId,
      text: "<script>alert(1)</script> This sentence is long enough to be a trait.",
      subject: { kind: "adult", login: "member" },
    },
    store,
  );
  assert.equal(wrote.ok, true);
  assert.equal(wrote.note, "");
  assert.equal(wrote.changed, false);
  assert.equal(wrote.persistedProfile, false);
  assert.equal(store.saves.length, 0);
  assert.equal(store.rows[0].profile, "Keeps the first line.");
});

test("the write appends a profile note and leaves milestones and media unpersisted", async () => {
  const store = memory([{ ...child }, { ...learner }]);
  const home = await applyEvolutionWrite(
    {
      orgId: child.orgId,
      membershipId: child.membershipId,
      text: LONG,
      filename: "call-notes.pdf",
      kind: "file",
      orgName: "Household",
      subject: { kind: "child", login: "none" },
    },
    store,
  );
  assert.equal(home.ok, true);
  assert.equal(home.table, EVOLUTION_PROFILE_TABLE);
  assert.equal(home.sealedAdultStore, SEALED_ADULT_PROFILE_STORE);
  assert.equal(home.subject, "Tracked child");
  assert.equal(home.note, NOTE);
  assert.equal(home.profile, NOTE);
  assert.equal(home.persistedMilestones, 0);
  assert.equal(home.persistedMedia, 0);
  assert.equal(home.persistedFamilies, 0);
  assert.equal(home.sealedAdultWrites, 0);
  assert.equal(home.edgeScopeColumn, false);
  assert.equal(store.rows[0].login, "none");
  assert.equal(store.sealed.length, 0);
  assert.doesNotMatch(store.rows[0].profile, /call-notes\.pdf/);

  const sales = await applyEvolutionWrite(
    {
      orgId: learner.orgId,
      membershipId: learner.membershipId,
      text: LONG,
      subject: { kind: "adult", login: "member" },
    },
    store,
  );
  assert.equal(sales.ok, true);
  assert.equal(sales.subject, "Login learner");
  assert.equal(sales.profile, `Keeps the first line. ${NOTE}`);
  assert.equal(store.rows[0].profile, NOTE);
  assert.equal(store.saves.length, 2);
  assert.deepEqual(
    store.saves.map((save) => save.orgId),
    ["org-home", "org-sales"],
  );
});

test("a second write of the same note does not append again", async () => {
  const store = memory([{ ...child, profile: NOTE }]);
  const again = await applyEvolutionWrite(
    {
      orgId: child.orgId,
      membershipId: child.membershipId,
      text: LONG,
      subject: { kind: "child", login: "none" },
    },
    store,
  );
  assert.equal(again.ok, true);
  assert.equal(again.changed, false);
  assert.equal(store.saves.length, 0);
  assert.equal(store.rows[0].profile, NOTE);
});

test("a short note and a missing row do not create a profile", async () => {
  const store = memory([]);
  const missing = await applyEvolutionWrite(
    {
      orgId: child.orgId,
      membershipId: child.membershipId,
      text: LONG,
      subject: { kind: "child", login: "none" },
    },
    store,
  );
  assert.deepEqual(missing, { ok: false, error: "no_profile_row" });
  assert.equal(store.saves.length, 0);

  const present = memory([{ ...learner }]);
  const short = await applyEvolutionWrite(
    {
      orgId: learner.orgId,
      membershipId: learner.membershipId,
      text: "short",
      filename: "clip.mp3",
      kind: "audio",
      subject: { kind: "adult", login: "member" },
    },
    present,
  );
  assert.equal(short.ok, true);
  assert.equal(short.note, "");
  assert.equal(short.persistedMedia, 0);
  assert.equal(present.saves.length, 0);
  assert.equal(present.rows[0].profile, learner.profile);
});

test("a full profile is left unchanged", () => {
  const full = appendProfileNote("x".repeat(1970), NOTE);
  assert.deepEqual(full, { ok: false, error: "profile_full" });
});

test("a mismatched subject does not write", async () => {
  const store = memory([{ ...child }]);
  const wrote = await applyEvolutionWrite(
    {
      orgId: child.orgId,
      membershipId: child.membershipId,
      text: LONG,
      subject: { kind: "adult", login: "member" },
    },
    store,
  );
  assert.deepEqual(wrote, { ok: false, error: "subject_mismatch" });
  assert.equal(store.saves.length, 0);
  assert.equal(store.rows[0].profile, "");
});

test("the slice keeps Drizzle and the campus adapter does not query retired tables", () => {
  const write = readFileSync(new URL("../src/lib/evolution/write.ts", import.meta.url), "utf8");
  const store = readFileSync(new URL("../src/lib/evolution/store.ts", import.meta.url), "utf8");
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const combined = `${write}\n${store}`;
  assert.equal(pkg.dependencies.next, "16.3.2");
  assert.equal(pkg.dependencies["@payloadcms/next"], undefined);
  assert.equal(CHECKOUT_GO_LIVE, false);
  assert.equal(COACHING_GO_LIVE, false);
  assert.doesNotMatch(store, /livingProfiles|living_profiles|living_brains/);
  assert.doesNotMatch(store, /\.set\(|\.update\(|\.insert\(|\.from\(/);
  assert.doesNotMatch(combined, /@payloadcms|payloadcms|userProfiles|kidProfiles|DROP TABLE|0032|0033|edge_scope|knowledge_edges|AUTH_URL\s*=/);
  assert.doesNotMatch(combined, /living_brains/);
  assert.equal(EVOLUTION_PROFILE_TABLE, "living_profiles");
  assert.equal(SEALED_ADULT_PROFILE_STORE, "user_profiles");
});
