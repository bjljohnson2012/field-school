import assert from "node:assert/strict";
import { mkdtemp, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { register } from "node:module";
import { dirname } from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { promisify } from "node:util";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");
const savedDatabaseUrl = process.env.DATABASE_URL;
delete process.env.DATABASE_URL;

register(
  "data:text/javascript," +
    encodeURIComponent(`
import { pathToFileURL } from "node:url";
const src = ${JSON.stringify(src)};
export async function resolve(specifier, context, nextResolve) {
  if (specifier === "next/server" || specifier === "next/headers" || specifier === "next/navigation") {
    return nextResolve(specifier + ".js", context);
  }
  const parent = context.parentURL || "";
  const ours = parent.includes("/app/src/") || parent.includes("/app/scripts/");
  if (ours && specifier.startsWith("@/")) {
    return nextResolve(pathToFileURL(src + "/" + specifier.slice(2) + ".ts").href, context);
  }
  if (ours && specifier.startsWith(".") && !/\\.(ts|js|mjs|cjs|json)$/.test(specifier)) {
    return nextResolve(specifier + ".ts", context);
  }
  return nextResolve(specifier, context);
}
`),
);

const mkdtempAsync = promisify(mkdtemp);
const { hash, compare } = await import("bcryptjs");
const route = await import(pathToFileURL(join(src, "app/api/coaching/account/password/route.ts")).href);
const policy = await import(pathToFileURL(join(src, "lib/members/policy.ts")).href);
const store = await import(pathToFileURL(join(src, "lib/members/store.ts")).href);
const auth = await import(pathToFileURL(join(src, "auth.ts")).href);

const EMAIL = "ada.password-pr18@example.test";
const SESSION_EMAIL = "Ada.Password-PR18@Example.Test";
const JSON_PASSWORD = "json-store-secret-11";
const AE_PASSWORD = "ae-coach-secret-22";
const NEXT_PASSWORD = "rotated-secret-33";
const OTHER_PASSWORD = "other-member-secret-44";
const INVITE = "https://portal.fieldschool.ai/invite/accept?token=raw-invite-token";
const MEMBER_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_ID = "22222222-2222-4222-8222-222222222222";

let aeHash = "";
let otherHash = "";

test.before(async () => {
  aeHash = await hash(AE_PASSWORD, 12);
  otherHash = await hash(OTHER_PASSWORD, 12);
});

test.after(() => {
  if (savedDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = savedDatabaseUrl;
  delete process.env.MEMBER_STORE_PATH;
});

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

function jsonRequest(body) {
  return new Request("https://portal.fieldschool.ai/api/coaching/account/password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function sessionFor(email = SESSION_EMAIL) {
  return async () => ({ user: { email, name: "Ada" } });
}

function createDb() {
  const state = {
    members: [
      { id: MEMBER_ID, email: EMAIL, name: "Ada" },
      { id: OTHER_ID, email: "other.password-pr18@example.test", name: "Other" },
    ],
    credentials: [
      { member_id: MEMBER_ID, source: "aecoach", password_hash: aeHash },
      { member_id: MEMBER_ID, source: "legacy", password_hash: otherHash },
      { member_id: OTHER_ID, source: "aecoach", password_hash: otherHash },
    ],
    deletes: 0,
  };
  const sql = (strings, ...values) => {
    const text = strings.join(" ").replace(/\s+/g, " ").trim().toLowerCase();
    if (text.includes("select c.password_hash")) {
      const email = values[0];
      const member = state.members.find((row) => row.email === email);
      if (!member) return Promise.resolve([]);
      const rows = state.credentials.filter((row) => row.member_id === member.id);
      if (!rows.length) return Promise.resolve([{ password_hash: null }]);
      return Promise.resolve(rows.map((row) => ({ password_hash: row.password_hash })));
    }
    if (text.startsWith("select id")) {
      const email = values[0];
      const member = state.members.find((row) => row.email === email);
      return Promise.resolve(member ? [{ id: member.id }] : []);
    }
    if (text.startsWith("delete") && text.includes("source =")) {
      state.deletes += 1;
      const [memberId, source] = values;
      state.credentials = state.credentials.filter(
        (row) => !(row.member_id === memberId && row.source === source),
      );
      return Promise.resolve([]);
    }
    if (text.startsWith("delete") && text.includes("source <>")) {
      state.deletes += 1;
      const [memberId, keep] = values;
      state.credentials = state.credentials.filter(
        (row) => !(row.member_id === memberId && row.source !== keep),
      );
      return Promise.resolve([]);
    }
    if (text.startsWith("insert")) {
      const [memberId, source, passwordHash] = values;
      const existing = state.credentials.find(
        (row) => row.member_id === memberId && row.source === source,
      );
      if (existing) existing.password_hash = passwordHash;
      else state.credentials.push({ member_id: memberId, source, password_hash: passwordHash });
      return Promise.resolve([]);
    }
    return Promise.reject(new Error(`unexpected sql: ${text}`));
  };
  return { state, sql };
}

async function seedStore() {
  const dir = await mkdtempAsync(join(tmpdir(), "account-password-"));
  process.env.MEMBER_STORE_PATH = join(dir, "campus-store.json");
  const created = await store.registerMember({
    name: "Ada",
    email: EMAIL,
    password: JSON_PASSWORD,
  });
  assert.equal(created.ok, true);
  return readFileSync(process.env.MEMBER_STORE_PATH, "utf8");
}

function storeHash() {
  const data = JSON.parse(readFileSync(process.env.MEMBER_STORE_PATH, "utf8"));
  const member = data.members.find((row) => row.email === EMAIL);
  return member?.passwordHash ?? "";
}

async function capture(fn) {
  const lines = [];
  const methods = ["log", "info", "warn", "error", "debug"];
  const original = new Map();
  for (const method of methods) {
    original.set(method, console[method]);
    console[method] = (...args) => {
      lines.push(args.map((part) => String(part)).join(" "));
    };
  }
  try {
    const result = await fn();
    return { result, lines };
  } finally {
    for (const [method, fnOriginal] of original) console[method] = fnOriginal;
  }
}

function assertQuiet(chunks, secrets) {
  const text = chunks.join("\n");
  for (const secret of secrets) {
    assert.equal(text.includes(secret), false);
  }
}

test("menu gains Account only and the page is signed-in", () => {
  const shell = read("src/components/app-shell.tsx");
  assert.equal(shell.match(/href="\/account"/g)?.length, 1);
  assert.match(shell, />\s*Account\s*</);
  assert.match(shell, />\s*My card\s*</);
  assert.match(shell, />\s*Sign out\s*</);
  assert.match(shell, /switchOrg/);
  assert.match(shell, /signOutPortal\("\/login"\)/);
  assert.equal(shell.split("<header").length - 1, 2);
  assert.equal(shell.includes("function GuestChrome"), true);
  assert.doesNotMatch(shell, /COACHING_SHELL|AUTH_URL/);
  assert.equal(read("src/lib/coaching/nav.ts").includes("/account"), false);

  const account = read("src/app/account/page.tsx");
  assert.match(account, /redirect\(ACCOUNT_LOGIN\)/);
  assert.match(account, /accountAccess\(email\) === "login"/);
  assert.match(account, /action="\/api\/coaching\/account\/password"/);
  assert.match(account, /Change the password for/);
  assert.doesNotMatch(account, /AppShell|GuestChrome|COACHING_SHELL|AUTH_URL/);
  assert.equal(route.ACCOUNT_LOGIN, "/login?next=/account");
  assert.equal(route.accountAccess(null), "login");
  assert.equal(route.accountAccess("  "), "login");
  assert.equal(route.accountAccess(EMAIL), "account");

  const source = read("src/app/api/coaching/account/password/route.ts");
  const members = read("src/lib/members/store.ts");
  assert.match(source, /verifyMemberLogin/);
  assert.match(source, /passwordError/);
  assert.match(source, /const BCRYPT_ROUNDS = 12/);
  assert.match(members, /const BCRYPT_ROUNDS = 12/);
  assert.match(source, /hash\(body\.newPassword, BCRYPT_ROUNDS\)/);
  assert.match(source, /field_school/);
  assert.match(source, /aecoach/);
  assert.match(source, /DELETE FROM member_credentials/);
  assert.match(source, /LEFT JOIN member_credentials/);
  assert.doesNotMatch(source, /console\.(log|info|error|debug|warn)/);
  assert.doesNotMatch(source, /role:\s*"admin"/);
  assert.doesNotMatch(
    source,
    /AUTH_URL|COACHING_SHELL|COACHING_WRITES|COACHING_IMPORT|CRON_SECRET|BrandTheme|AiJob|campus\/client/,
  );
  assert.equal(typeof route.POST, "function");
  assert.equal(route.GET, undefined);

  const authSource = read("src/auth.ts");
  assert.match(authSource, /roleForAuth\(\s*"credentials"/);
  assert.match(authSource, /if \(input\.role !== "member"\) return null/);
  assert.match(authSource, /const role = "member" as const/);
  assert.equal(policy.roleForAuth("credentials", "bjljohnson2012@gmail.com"), "member");
  assert.equal(
    auth.credentialSessionUser({
      email: EMAIL,
      role: "admin",
      jsonMember: { id: "member-1", email: EMAIL, name: "Ada" },
      credentialMember: { id: MEMBER_ID, email: EMAIL, name: "Ada" },
    }),
    null,
  );
});

test("POST is 401 without a session and does not echo secrets", async () => {
  await seedStore();
  const db = createDb();
  const before = readFileSync(process.env.MEMBER_STORE_PATH, "utf8");
  const { result, lines } = await capture(() =>
    route.handleAccountPassword(
      jsonRequest({
        currentPassword: JSON_PASSWORD,
        newPassword: NEXT_PASSWORD,
        inviteUrl: INVITE,
        passwordHash: aeHash,
      }),
      { session: async () => null, sql: db.sql },
    ),
  );
  assert.equal(result.status, 401);
  const text = await result.text();
  assert.deepEqual(JSON.parse(text), { ok: false, error: "unauthorized" });
  assertQuiet([text, ...lines], [JSON_PASSWORD, NEXT_PASSWORD, INVITE, aeHash]);
  assert.equal(readFileSync(process.env.MEMBER_STORE_PATH, "utf8"), before);
  assert.equal(db.state.deletes, 0);
  assert.equal(db.state.credentials.filter((row) => row.source === "aecoach").length, 2);
});

test("a bad current password and a short new password do not write", async () => {
  await seedStore();
  const db = createDb();
  const before = readFileSync(process.env.MEMBER_STORE_PATH, "utf8");
  const bad = await route.handleAccountPassword(
    jsonRequest({ currentPassword: "not-the-password", newPassword: NEXT_PASSWORD, inviteUrl: INVITE }),
    { session: sessionFor(), sql: db.sql },
  );
  assert.equal(bad.status, 400);
  const badText = await bad.text();
  assert.deepEqual(JSON.parse(badText), { ok: false, error: "Current password did not match." });
  assert.equal(badText.includes(INVITE), false);
  assert.equal(badText.includes("not-the-password"), false);
  assert.equal(readFileSync(process.env.MEMBER_STORE_PATH, "utf8"), before);
  assert.equal(db.state.deletes, 0);

  const short = await route.handleAccountPassword(
    jsonRequest({ currentPassword: JSON_PASSWORD, newPassword: "short", inviteUrl: INVITE }),
    { session: sessionFor(), sql: db.sql },
  );
  assert.equal(short.status, 400);
  const shortBody = await short.json();
  assert.equal(shortBody.error, policy.passwordError("short"));
  assert.equal(JSON.stringify(shortBody).includes("short"), false);
  assert.equal(readFileSync(process.env.MEMBER_STORE_PATH, "utf8"), before);
});

test("rotation writes bcrypt 12 JSON and one field_school row, and the old AE hash fails", async () => {
  await seedStore();
  const db = createDb();
  const { result, lines } = await capture(() =>
    route.handleAccountPassword(
      jsonRequest({
        currentPassword: AE_PASSWORD,
        newPassword: NEXT_PASSWORD,
        inviteUrl: INVITE,
      }),
      { session: sessionFor(), sql: db.sql },
    ),
  );
  assert.equal(result.status, 200);
  const text = await result.text();
  assert.deepEqual(JSON.parse(text), { ok: true });
  const jsonHash = storeHash();
  assert.match(jsonHash, /^\$2[aby]\$12\$/);
  assert.equal(await compare(NEXT_PASSWORD, jsonHash), true);
  assert.equal(await compare(AE_PASSWORD, jsonHash), false);
  assert.equal(await compare(JSON_PASSWORD, jsonHash), false);

  const mine = db.state.credentials.filter((row) => row.member_id === MEMBER_ID);
  assert.equal(mine.length, 1);
  assert.equal(mine[0].source, "field_school");
  assert.equal(mine[0].password_hash, jsonHash);
  assert.equal(db.state.credentials.some((row) => row.member_id === MEMBER_ID && row.source === "aecoach"), false);
  assert.equal(db.state.credentials.some((row) => row.member_id === MEMBER_ID && row.source === "legacy"), false);
  assert.equal(
    db.state.credentials.filter((row) => row.member_id === OTHER_ID && row.source === "aecoach").length,
    1,
  );

  async function authorize(password) {
    const jsonMember = await store.verifyMemberLogin(EMAIL, password);
    let credentialMember = null;
    for (const row of db.state.credentials.filter((item) => item.member_id === MEMBER_ID)) {
      if (await compare(password, row.password_hash)) {
        credentialMember = { id: MEMBER_ID, email: EMAIL, name: "Ada" };
      }
    }
    return auth.credentialSessionUser({
      email: EMAIL,
      role: policy.roleForAuth("credentials", EMAIL),
      jsonMember,
      credentialMember,
    });
  }

  assert.equal(await authorize(AE_PASSWORD), null);
  assert.equal(await authorize(JSON_PASSWORD), null);
  const signedIn = await authorize(NEXT_PASSWORD);
  assert.equal(signedIn?.role, "member");
  assert.equal(signedIn?.email, EMAIL);
  assertQuiet([text, ...lines], [JSON_PASSWORD, AE_PASSWORD, NEXT_PASSWORD, INVITE, aeHash, jsonHash]);
});

test("JSON current password also rotates and a credential failure rolls the JSON hash back", async () => {
  await seedStore();
  const db = createDb();
  const rotated = await route.handleAccountPassword(
    jsonRequest({ currentPassword: JSON_PASSWORD, newPassword: NEXT_PASSWORD }),
    { session: sessionFor(), sql: db.sql },
  );
  assert.equal(rotated.status, 200);
  assert.equal(await store.verifyMemberLogin(EMAIL, NEXT_PASSWORD) !== null, true);
  assert.equal(db.state.credentials.filter((row) => row.member_id === MEMBER_ID && row.source === "field_school").length, 1);

  await seedStore();
  const before = storeHash();
  const failing = createDb();
  const sql = (strings, ...values) => {
    const text = strings.join(" ").replace(/\s+/g, " ").trim().toLowerCase();
    if (text.startsWith("delete")) {
      return Promise.reject(new Error(`db down ${aeHash}`));
    }
    return failing.sql(strings, ...values);
  };
  const response = await route.handleAccountPassword(
    jsonRequest({ currentPassword: JSON_PASSWORD, newPassword: NEXT_PASSWORD, inviteUrl: INVITE }),
    { session: sessionFor(), sql },
  );
  assert.equal(response.status, 500);
  const text = await response.text();
  assert.deepEqual(JSON.parse(text), { ok: false, error: "failed" });
  assert.equal(text.includes(aeHash), false);
  assert.equal(text.includes(NEXT_PASSWORD), false);
  assert.equal(text.includes(INVITE), false);
  assert.equal(storeHash(), before);
  assert.equal(await store.verifyMemberLogin(EMAIL, JSON_PASSWORD) !== null, true);
  assert.equal(await store.verifyMemberLogin(EMAIL, NEXT_PASSWORD), null);
  assert.equal(failing.state.credentials.some((row) => row.member_id === MEMBER_ID && row.source === "aecoach"), true);
});

test("a form mismatch redirects without the password", async () => {
  await seedStore();
  const before = readFileSync(process.env.MEMBER_STORE_PATH, "utf8");
  const body = new URLSearchParams({
    currentPassword: JSON_PASSWORD,
    newPassword: NEXT_PASSWORD,
    confirmPassword: "different-secret-55",
  });
  const response = await route.handleAccountPassword(
    new Request("https://portal.fieldschool.ai/api/coaching/account/password", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    }),
    { session: sessionFor(), sql: createDb().sql },
  );
  assert.equal(response.status, 303);
  const location = response.headers.get("location") || "";
  assert.match(location, /\/account\?error=mismatch$/);
  assert.equal(location.includes(JSON_PASSWORD), false);
  assert.equal(location.includes(NEXT_PASSWORD), false);
  assert.equal(readFileSync(process.env.MEMBER_STORE_PATH, "utf8"), before);
});
