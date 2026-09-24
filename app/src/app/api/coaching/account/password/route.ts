import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { compare, hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { passwordError, normalizeEmail, isValidEmail } from "@/lib/members/policy";
import { resolveStorePath, verifyMemberLogin } from "@/lib/members/store";
import type { CampusStoreFile, StoredMember } from "@/lib/members/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const ACCOUNT_LOGIN = "/login?next=/account";

export function accountAccess(email?: string | null) {
  return email?.trim() ? "account" : "login";
}

/** Same cost as `BCRYPT_ROUNDS` in `src/lib/members/store.ts`. */
const BCRYPT_ROUNDS = 12;

const FIELD_SCHOOL_SOURCE = "field_school";
const AECOACH_SOURCE = "aecoach";

type SqlQuery = {
  <T extends Record<string, unknown>[] = Record<string, unknown>[]>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
};

export type AccountPasswordDeps = {
  session?: () => Promise<{
    user?: { email?: string | null; name?: string | null } | null;
  } | null>;
  sql?: SqlQuery | null;
};

type PasswordBody = {
  currentPassword: string;
  newPassword: string;
  confirmPassword?: string;
  form: boolean;
};

let writeChain: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

function emptyStore(): CampusStoreFile {
  return { members: [], accessRequests: [], formSubmissions: [], purchases: [] };
}

async function readStore(path: string): Promise<{ store: CampusStoreFile; existed: boolean }> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as Partial<CampusStoreFile>;
    return {
      existed: true,
      store: {
        members: Array.isArray(parsed.members) ? parsed.members : [],
        accessRequests: Array.isArray(parsed.accessRequests) ? parsed.accessRequests : [],
        formSubmissions: Array.isArray(parsed.formSubmissions) ? parsed.formSubmissions : [],
        purchases: Array.isArray(parsed.purchases) ? parsed.purchases : [],
      },
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return { store: emptyStore(), existed: false };
    throw error;
  }
}

async function writeStore(path: string, data: CampusStoreFile) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await rename(tmp, path);
}

function applyHash(member: StoredMember, passwordHash: string) {
  member.passwordHash = passwordHash;
  member.provider = "credentials";
  delete member.claimToken;
  delete member.claimTokenExpiresAt;
}

async function writeJsonPassword(email: string, name: string, passwordHash: string) {
  const path = resolveStorePath();
  return withLock(async () => {
    const { store, existed } = await readStore(path);
    const previous = JSON.parse(JSON.stringify(store)) as CampusStoreFile;
    let member = store.members.find((item) => item.email === email);
    if (!member) {
      member = {
        id: `member-${randomUUID()}`,
        email,
        name: name.trim() || email,
        passwordHash,
        provider: "credentials",
        createdAt: new Date().toISOString(),
        seatKind: "course",
        courseCap: 1,
      };
      store.members.push(member);
    } else {
      applyHash(member, passwordHash);
    }
    await writeStore(path, store);
    return {
      async undo() {
        await withLock(async () => {
          if (!existed) {
            await unlink(path).catch((error: NodeJS.ErrnoException) => {
              if (error.code !== "ENOENT") throw error;
            });
            return;
          }
          await writeStore(path, previous);
        });
      },
    };
  });
}

/**
 * Same lookup shape as auth.ts `matchMemberCredential`:
 * members LEFT JOIN member_credentials, any hash may match.
 */
export async function listCredentialHashes(sql: SqlQuery, email: string) {
  const rows = await sql<{ password_hash: string | null }[]>`
    SELECT c.password_hash
    FROM members m
    LEFT JOIN member_credentials c ON c.member_id = m.id
    WHERE lower(m.email) = ${email}
  `;
  return rows
    .map((row) => row.password_hash)
    .filter((value): value is string => typeof value === "string" && value.length > 0);
}

export async function replaceFieldSchoolCredential(
  sql: SqlQuery,
  email: string,
  passwordHash: string,
): Promise<{ ok: true; replaced: boolean } | { ok: false; error: "failed" }> {
  const found = await sql<{ id: string }[]>`
    SELECT id FROM members WHERE lower(email) = ${email}
  `;
  const memberId = found[0]?.id;
  if (!memberId) return { ok: true, replaced: false };
  await sql`
    DELETE FROM member_credentials
    WHERE member_id = ${memberId} AND source = ${AECOACH_SOURCE}
  `;
  await sql`
    DELETE FROM member_credentials
    WHERE member_id = ${memberId} AND source <> ${FIELD_SCHOOL_SOURCE}
  `;
  await sql`
    INSERT INTO member_credentials (member_id, source, password_hash)
    VALUES (${memberId}, ${FIELD_SCHOOL_SOURCE}, ${passwordHash})
    ON CONFLICT (member_id, source)
    DO UPDATE SET password_hash = EXCLUDED.password_hash
  `;
  return { ok: true, replaced: true };
}

async function currentMatches(email: string, password: string, hashes: string[]) {
  const jsonMember = await verifyMemberLogin(email, password);
  if (jsonMember) return true;
  for (const stored of hashes) {
    try {
      if (await compare(password, stored)) return true;
    } catch {
      // A malformed hash is not a match.
    }
  }
  return false;
}

async function defaultSession() {
  const { auth } = await import("@/auth");
  return auth().catch(() => null);
}

async function defaultSql(deps: AccountPasswordDeps): Promise<SqlQuery | null> {
  if (deps.sql !== undefined) return deps.sql;
  const { databaseUrl, getSql } = await import("@/lib/db/client");
  if (!databaseUrl()) return null;
  return getSql() as unknown as SqlQuery;
}

function errorCode(error: string) {
  if (error === "Current password did not match.") return "current";
  if (error === "New password did not match the confirmation.") return "mismatch";
  if (error.includes("at least")) return "short";
  if (error.includes("at most")) return "long";
  return "failed";
}

function finish(request: Request, form: boolean, status: number, error: string | null) {
  if (!form) {
    if (status === 401) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    if (error) return NextResponse.json({ ok: false, error }, { status });
    return NextResponse.json({ ok: true });
  }
  if (status === 401) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", "/account");
    return NextResponse.redirect(url, 303);
  }
  const url = new URL("/account", request.url);
  if (error) url.searchParams.set("error", errorCode(error));
  else url.searchParams.set("saved", "1");
  return NextResponse.redirect(url, 303);
}

async function readBody(request: Request): Promise<PasswordBody | Response> {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) {
    try {
      const text = await request.text();
      if (!text.trim()) return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
      const parsed = JSON.parse(text) as Record<string, unknown>;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
      }
      const body: PasswordBody = {
        currentPassword: typeof parsed.currentPassword === "string" ? parsed.currentPassword : "",
        newPassword: typeof parsed.newPassword === "string" ? parsed.newPassword : "",
        form: false,
      };
      if (typeof parsed.confirmPassword === "string") body.confirmPassword = parsed.confirmPassword;
      return body;
    } catch {
      return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
    }
  }
  try {
    const form = await request.formData();
    const confirm = form.get("confirmPassword");
    return {
      currentPassword: typeof form.get("currentPassword") === "string" ? String(form.get("currentPassword")) : "",
      newPassword: typeof form.get("newPassword") === "string" ? String(form.get("newPassword")) : "",
      confirmPassword: typeof confirm === "string" ? confirm : "",
      form: true,
    };
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
}

function isFormRequest(request: Request) {
  const type = request.headers.get("content-type") || "";
  return (
    type.includes("application/x-www-form-urlencoded") || type.includes("multipart/form-data")
  );
}

export async function handleAccountPassword(request: Request, deps: AccountPasswordDeps = {}) {
  const formRequest = isFormRequest(request);
  const session = await (deps.session ?? defaultSession)();
  const email = normalizeEmail(session?.user?.email);
  if (!email || !isValidEmail(email)) return finish(request, formRequest, 401, "unauthorized");
  const name = session?.user?.name?.trim() || email;

  const body = await readBody(request);
  if (body instanceof Response) return body;
  const rule = passwordError(body.newPassword);
  if (rule) return finish(request, body.form, 400, rule);
  if (body.confirmPassword !== undefined && body.confirmPassword !== body.newPassword) {
    return finish(request, body.form, 400, "New password did not match the confirmation.");
  }

  let sql: SqlQuery | null = null;
  try {
    sql = await defaultSql(deps);
  } catch {
    return finish(request, body.form, 503, "failed");
  }

  let hashes: string[] = [];
  if (sql) {
    try {
      hashes = await listCredentialHashes(sql, email);
    } catch {
      return finish(request, body.form, 503, "failed");
    }
  }

  const matches = await currentMatches(email, body.currentPassword, hashes);
  if (!matches) return finish(request, body.form, 400, "Current password did not match.");

  const passwordHash = await hash(body.newPassword, BCRYPT_ROUNDS);
  const written = await writeJsonPassword(email, name, passwordHash);
  if (sql) {
    try {
      const replaced = await replaceFieldSchoolCredential(sql, email, passwordHash);
      if (!replaced.ok) {
        await written.undo();
        return finish(request, body.form, 500, "failed");
      }
    } catch {
      await written.undo();
      return finish(request, body.form, 500, "failed");
    }
  }

  return finish(request, body.form, 200, null);
}

export async function POST(request: Request) {
  return handleAccountPassword(request);
}
