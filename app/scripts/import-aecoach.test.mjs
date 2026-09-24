import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  SOURCE_QUERIES,
  assertCoachingImport,
  assertDestinationDatabase,
  databaseName,
  fileSkipReason,
  finishImport,
  mapVisibility,
  planImport,
  planOrgPlacement,
  renderImportReport,
  runImport,
  stanceForRole,
  validateOrgMap,
} from "./import-aecoach.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => readFileSync(join(root, rel), "utf8");

function blankSource() {
  const source = {};
  for (const [key] of SOURCE_QUERIES) source[key] = [];
  return source;
}

function ids() {
  let n = 0;
  return () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`;
}

function campus() {
  return {
    orgs: [
      { id: "org-sales", slug: "sales", name: "Sales", features: {} },
      { id: "org-hh", slug: "household", name: "Household", features: {} },
      { id: "org-fs", slug: "field-school", name: "Field School", features: {} },
    ],
    members: [{ id: "mem-child", email: "kid@example.com", name: "Kid", kind: "child" }],
    memberships: [{ id: "m-child", org_id: "org-hh", member_id: "mem-child", stance: "learner" }],
    capabilities: [],
    legacy: [],
    skills: [],
  };
}

function fixture() {
  const source = blankSource();
  source.orgs = [
    {
      id: "org-acme",
      name: "Acme",
      slug: "acme",
      brand_logo_url: "https://cdn.example/logo.png",
      brand_palette: { primary: "#000" },
      ai_model: "grok-4",
      status: "ACTIVE",
    },
    {
      id: "org-sales-src",
      name: "Sales copy",
      slug: "sales",
      brand_logo_url: "http://insecure.example/logo.png",
      status: "ACTIVE",
    },
  ];
  source.company_profiles = [
    {
      org_id: "org-acme",
      required_skills: [],
      values: ["care"],
      sales_methodology: "field",
      improve_button_label: "Sharpen",
      smtp_pass: "smtp-secret-value",
      brand_palette: { accent: "#fff" },
    },
  ];
  source.users = [
    { id: "u-ae", email: " AE@Example.com ", name: "Ada", password_hash: "$2a$12$aehashaehashaehashaeha", role: "AE", org_id: "org-acme", vp_id: "u-director" },
    { id: "u-director", email: "director@example.com", name: "Dee", password_hash: "$2a$12$directorhashdirectorha", role: "DIRECTOR", org_id: "org-acme", vp_id: null },
    { id: "u-admin", email: "admin@example.com", name: "Pat", password_hash: null, role: "ORG_ADMIN", org_id: "org-acme" },
    { id: "u-kid", email: "kid@example.com", name: "Kid", password_hash: "$2a$12$kidhashkidhashkidhashxx", role: "AE", org_id: "org-acme" },
  ];
  source.ae_profiles = [
    { id: "p-ae", user_id: "u-ae", org_id: "org-acme", director_id: "u-director", personality_summary: "steady", motivations: [], strengths_json: [], weaknesses_json: [] },
  ];
  source.tasks = [
    { id: "t-leader", ae_profile_id: null, assignee_user_id: "u-director", created_by_user_id: "u-admin", title: "Lead the week", description: "private note", status: "OPEN" },
  ];
  source.coaching_notes = [
    { id: "n1", ae_profile_id: "p-ae", director_id: "u-director", content: "hidden", visible_to_ae: false },
  ];
  source.skill_scores = [
    { id: "s1", ae_profile_id: "p-ae", category: "DISCOVERY", score: 70, notes: "observed", source: "DIRECTOR_OVERRIDE", last_updated_by_user_id: "u-director" },
  ];
  source.products = [{ id: "prod1", org_id: "org-acme", name: "Kit", slug: "kit", active: true }];
  source.questions = [
    { id: "q1", org_id: "org-acme", category: "DISCOVERY", question_type: "LONG_FORM", text: "What happened?", options_json: null, tags_json: [], weight: 1, active: true },
  ];
  source.file_assets = [
    { id: "f-bak", org_id: "org-acme", owner_user_id: "u-director", filename: "notes.bak", storage_path: "/tmp/notes.bak", size_bytes: 12, visibility: "BOTH" },
    { id: "f-role", org_id: "org-acme", owner_user_id: "u-director", filename: "DIRECTOR", storage_path: "/tmp/DIRECTOR", size_bytes: 0, visibility: "AE_ONLY" },
    { id: "f-ok", org_id: "org-acme", owner_user_id: "u-director", filename: "call.txt", storage_path: "/var/ae/call.txt", mime_type: "text/plain", size_bytes: 4, visibility: "AE_ONLY", mapping_id: "map1" },
  ];
  source.file_mappings = [
    { id: "map1", org_id: "org-acme", kind: "GENERAL", update_intent: "ADD_TO_COACHING_LOG", visibility: "DIRECTOR_ONLY" },
  ];
  source.knowledge_repositories = [
    { id: "repo1", org_id: "org-acme", kind: "SALES_SKILL", name: "Desk", visibility: "BOTH" },
  ];
  source.knowledge_articles = [
    { id: "art1", org_id: "org-acme", repository_id: "repo1", title: "Open", body: "body", status: "APPROVED", tags_json: [] },
  ];
  source.director_reviews = [
    { id: "rev1", director_id: "u-director", ae_profile_id: "p-ae", month_of: "2026-09-01T00:00:00.000Z", status: "PENDING" },
  ];
  source.ad_hoc_quizzes = [
    { id: "quiz1", ae_profile_id: "p-ae", sent_by_user_id: "u-director", title: "Check", question_ids: ["q1"], token_hash: "hash-not-a-url", status: "PENDING" },
  ];
  source.invite_tokens = [
    { id: "inv1", user_id: "u-ae", expires_at: "2099-01-01T00:00:00.000Z", used_at: null },
  ];
  return source;
}

function planFixture(orgMap = []) {
  const minted = [];
  const plan = planImport({
    source: fixture(),
    campus: campus(),
    orgMap,
    now: new Date("2026-09-24T00:00:00.000Z"),
    ids: ids(),
    mintToken: () => {
      const token = "https://portal.example/invite/SECRETTOKEN";
      minted.push(token);
      return token;
    },
    fileExists: (path) => path === "/var/ae/call.txt",
  });
  return { plan, minted };
}

test("org map ships empty and rejects reserved targets", () => {
  assert.deepEqual(JSON.parse(read("scripts/aecoach-org-map.json")), []);
  assert.deepEqual(validateOrgMap([]), []);
  assert.throws(() => validateOrgMap([{ from: "acme", to: "household" }]), /org_map_reserved_target/);
  assert.throws(() => validateOrgMap([{ from: "acme", to: "field-school" }]), /org_map_reserved_target/);
  assert.deepEqual(validateOrgMap([{ from: "acme", to: "sales" }]), [{ from: "acme", to: "sales" }]);
});

test("reserved slugs are suffixed unless the map merges into sales", () => {
  const existing = new Set(["sales", "household", "field-school"]);
  assert.deepEqual(planOrgPlacement({ sourceSlug: "sales", map: [], existingSlugs: existing }), {
    mode: "create",
    slug: "sales-aecoach",
    sourceSlug: "sales",
    collided: true,
  });
  assert.equal(planOrgPlacement({ sourceSlug: "acme", map: [{ from: "acme", to: "sales" }], existingSlugs: existing }).mode, "merge");
});

test("visibility, files, and roles stay on the coaching side of the desk", () => {
  assert.equal(mapVisibility("AE_ONLY"), "learner");
  assert.equal(mapVisibility("DIRECTOR_ONLY"), "coach");
  assert.equal(mapVisibility("BOTH"), "both");
  assert.equal(fileSkipReason("AppShell.tsx.bak", 10), "bak");
  assert.equal(fileSkipReason("DIRECTOR", 0), "role_marker");
  assert.equal(fileSkipReason("call.txt", 4), null);
  assert.deepEqual(stanceForRole("ORG_ADMIN"), { stance: "learner", capabilities: [] });
  assert.equal(stanceForRole("COMPANY_ADMIN").capabilities.includes("platform_admin"), false);
});

test("import creates one org per source, keeps credentials additive, and counts only", () => {
  const { plan, minted } = planFixture();
  assert.equal(plan.unexplained.length, 0);
  assert.equal(plan.errors.length, 0);
  const report = renderImportReport(plan.counts);
  assert.match(report, /table=orgs source=2 dest=2 skipped=0/);
  assert.match(report, /table=tasks source=1 dest=1 skipped=0/);
  assert.equal(minted.length, 1);
  assert.doesNotMatch(report, /@/);
  assert.doesNotMatch(report, /\$2a\$/);
  assert.doesNotMatch(report, /https?:\/\//);
  assert.doesNotMatch(report, /SECRETTOKEN/);
  assert.doesNotMatch(report, /smtp-secret-value/);

  const text = plan.statements.map((row) => row.text).join("\n");
  assert.doesNotMatch(text, /^\s*delete\b/im);
  assert.doesNotMatch(text, /smtp_pass|brand_palette|campus-store|recheck_cadence/i);
  const orgInserts = plan.statements.filter((row) => row.text.startsWith("INSERT INTO organizations"));
  assert.deepEqual(orgInserts.map((row) => row.values[1]).sort(), ["acme", "sales-aecoach"]);
  const collided = orgInserts.find((row) => row.values[1] === "sales-aecoach");
  assert.equal(JSON.parse(collided.values[3]).sourceSlug, "sales");
  const acme = orgInserts.find((row) => row.values[1] === "acme");
  const features = JSON.parse(acme.values[3]);
  assert.equal(features.logoUrl, "https://cdn.example/logo.png");
  assert.equal(features.salesMethodology, "field");
  assert.equal(features.brandPalette, undefined);
  assert.equal(features.smtpPass, undefined);

  const creds = plan.statements.filter((row) => row.text.includes("INSERT INTO member_credentials"));
  assert.equal(creds.length, 2);
  assert.ok(creds.every((row) => row.text.includes("'aecoach'")));
  assert.ok(creds.every((row) => !row.values.includes("mem-child")));
  assert.ok(creds.every((row) => !row.text.includes("$2a$")));

  const memberships = plan.statements.filter((row) => row.text.startsWith("INSERT INTO memberships"));
  const admin = plan.statements.find((row) => row.text.startsWith("INSERT INTO members") && row.values[1] === "admin@example.com");
  const adminMemberships = memberships.filter((row) => row.values[2] === admin.values[0]);
  const fieldSchool = adminMemberships.find((row) => row.values[1] === "org-fs");
  assert.equal(fieldSchool.values[3], "admin");
  assert.ok(adminMemberships.filter((row) => row.values[1] !== "org-fs").every((row) => row.values[3] === "learner"));
  const platform = plan.statements.filter((row) => row.values[1] === "platform_admin");
  assert.equal(platform.length, 1);
  assert.equal(platform[0].values[0], fieldSchool.values[0]);

  const task = plan.statements.find((row) => row.text.startsWith("INSERT INTO work_items"));
  assert.ok(task.values[2]);
  assert.equal(task.values[4], null);
  const file = plan.statements.find((row) => row.text.startsWith("INSERT INTO coaching_sources"));
  assert.equal(file.values[8], "learner");
  assert.equal(plan.statements.some((row) => row.text.includes("notes.bak")), false);
  assert.equal(plan.copies.length, 1);
  assert.equal(plan.statements.some((row) => String(row.values).includes("mem-child")), false);
});

test("a filled map merges into sales and does not delete the sales org", () => {
  const { plan } = planFixture([{ from: "acme", to: "sales" }]);
  const orgInserts = plan.statements.filter((row) => row.text.startsWith("INSERT INTO organizations"));
  assert.equal(orgInserts.some((row) => row.values[1] === "acme"), false);
  const updates = plan.statements.filter((row) => row.text.startsWith("UPDATE organizations"));
  assert.equal(updates.length, 1);
  assert.match(updates[0].text, /slug = 'sales'/);
  assert.doesNotMatch(updates[0].text, /household|field-school/);
  assert.equal(plan.unexplained.length, 0);
});

test("dry-run rolls back and does not copy files", async () => {
  const { plan } = planFixture();
  const state = { began: 0, committed: 0, rolledBack: 0 };
  const db = {
    async query() {},
    async begin(fn) {
      state.began += 1;
      try {
        await fn(db);
        state.committed += 1;
      } catch (err) {
        state.rolledBack += 1;
        throw err;
      }
    },
  };
  let copied = 0;
  const outcome = await finishImport({
    dest: db,
    plan,
    dryRun: true,
    copyFile: async () => {
      copied += 1;
    },
  });
  assert.equal(outcome.rolledBack, true);
  assert.equal(state.began, 1);
  assert.equal(state.committed, 0);
  assert.equal(state.rolledBack, 1);
  assert.equal(copied, 0);
});

test("the script refuses without the import flag and refuses an aecoach destination", async () => {
  assert.throws(() => assertCoachingImport({}), /coaching_import_required/);
  assert.equal(databaseName("postgres://localhost/aecoach"), "aecoach");
  assert.throws(() => assertDestinationDatabase("postgres://localhost/aecoach"), /destination_is_aecoach/);
  let connected = 0;
  await assert.rejects(
    () => runImport({
      env: { COACHING_IMPORT: "1", DATABASE_URL: "postgres://localhost/aecoach", AECOACH_DATABASE_URL: "postgres://localhost/source" },
      argv: ["--dry-run"],
      connect: async () => {
        connected += 1;
        return { query: async () => [], begin: async (fn) => fn({ query: async () => [] }), end: async () => {} };
      },
      readMap: () => [],
    }),
    (err) => err.code === "destination_is_aecoach",
  );
  assert.equal(connected, 0);
  const sql = SOURCE_QUERIES.map(([, query]) => query).join("\n");
  assert.doesNotMatch(sql, /smtp_pass|brand_palette|recheck_cadences|email_change_requests|user_game_stats/);
});

test("cli refusal stays counts-free and does not echo a url", () => {
  const script = join(root, "scripts/import-aecoach.mjs");
  const env = { PATH: process.env.PATH || "" };
  const missing = spawnSync(process.execPath, [script], { env, encoding: "utf8" });
  assert.notEqual(missing.status, 0);
  const missingOut = `${missing.stdout}${missing.stderr}`;
  assert.match(missingOut, /coaching_import_required/);
  assert.doesNotMatch(missingOut, /@|postgres:\/\//);
  const named = spawnSync(process.execPath, [script, "--dry-run"], {
    env: {
      ...env,
      COACHING_IMPORT: "1",
      DATABASE_URL: "postgres://localhost/aecoach",
      AECOACH_DATABASE_URL: "postgres://localhost/source",
    },
    encoding: "utf8",
  });
  assert.notEqual(named.status, 0);
  const namedOut = `${named.stdout}${named.stderr}`;
  assert.match(namedOut, /destination_is_aecoach/);
  assert.doesNotMatch(namedOut, /postgres:\/\/|smtp-secret|SECRETTOKEN/);
});

test("authorize accepts either store and credentials cannot mint admin", () => {
  const auth = read("src/auth.ts");
  assert.match(auth, /member_credentials/);
  assert.match(auth, /verifyMemberLogin/);
  assert.match(auth, /compare\(password, hash\)/);
  assert.match(auth, /roleForAuth\(\s*"credentials"/);
  assert.match(auth, /if \(input\.role !== "member"\) return null/);
  assert.match(auth, /const role = "member" as const/);
  assert.doesNotMatch(auth, /return \{[^}]*role:\s*"admin"/s);
  const deploy = read("DEPLOY.md");
  assert.match(deploy, /COACHING_ROLLBACK_CONFIRM=1/);
  assert.match(deploy, /legacy_ids/);
  assert.match(deploy, /COACHING_IMPORT=1/);
  assert.doesNotMatch(deploy, /smtp-secret|sk_live|BEGIN RSA|postgres:\/\/\w+:[^@\s]+@/);
});
