import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { compare, hash } from "bcryptjs";
import {
  isValidEmail,
  normalizeEmail,
  passwordError,
} from "@/lib/members/policy";
import { sortFormSubmissions } from "@/lib/members/forms";
import type {
  AccessRequest,
  CampusStoreFile,
  FormKind,
  FormSubmission,
  MemberProvider,
  StoredMember,
} from "@/lib/members/types";

const BCRYPT_ROUNDS = 12;
let writeChain: Promise<unknown> = Promise.resolve();

export function defaultStorePath() {
  if (process.env.NODE_ENV === "production") {
    return "/app/data/campus-store.json";
  }
  return join(process.cwd(), ".data", "campus-store.json");
}

export function resolveStorePath() {
  return process.env.MEMBER_STORE_PATH?.trim() || defaultStorePath();
}

function emptyStore(): CampusStoreFile {
  return { members: [], accessRequests: [], formSubmissions: [] };
}

async function readStore(path: string): Promise<CampusStoreFile> {
  try {
    const raw = await readFile(path, "utf8");
    const parsed = JSON.parse(raw) as Partial<CampusStoreFile>;
    return {
      members: Array.isArray(parsed.members) ? parsed.members : [],
      accessRequests: Array.isArray(parsed.accessRequests)
        ? parsed.accessRequests
        : [],
      formSubmissions: Array.isArray(parsed.formSubmissions)
        ? parsed.formSubmissions
        : [],
    };
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT") return emptyStore();
    throw error;
  }
}

async function writeStore(path: string, data: CampusStoreFile) {
  await mkdir(dirname(path), { recursive: true });
  const tmp = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(tmp, JSON.stringify(data, null, 2), { mode: 0o600 });
  await rename(tmp, path);
}

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export async function findMemberByEmail(email: string) {
  const mail = normalizeEmail(email);
  if (!mail) return null;
  const store = await readStore(resolveStorePath());
  return store.members.find((m) => m.email === mail) ?? null;
}

export async function registerMember(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true; member: StoredMember } | { ok: false; error: string }> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const pwdError = passwordError(input.password);
  if (!name) return { ok: false, error: "Name is required." };
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email." };
  if (pwdError) return { ok: false, error: pwdError };

  return withLock(async () => {
    const path = resolveStorePath();
    const store = await readStore(path);
    if (store.members.some((m) => m.email === email)) {
      return { ok: false, error: "An account with that email already exists. Sign in instead." };
    }
    const member: StoredMember = {
      id: `member-${randomUUID()}`,
      email,
      name,
      passwordHash: await hash(input.password, BCRYPT_ROUNDS),
      provider: "credentials",
      createdAt: new Date().toISOString(),
    };
    store.members.push(member);
    await writeStore(path, store);
    const { passwordHash: _omit, ...safe } = member;
    return { ok: true, member: safe as StoredMember };
  });
}

export async function verifyMemberLogin(
  email: string,
  password: string,
): Promise<{ id: string; email: string; name: string; provider: "credentials" } | null> {
  const member = await findMemberByEmail(email);
  if (!member?.passwordHash) return null;
  const matches = await compare(password, member.passwordHash);
  if (!matches) return null;
  return {
    id: member.id,
    email: member.email,
    name: member.name,
    provider: "credentials",
  };
}

export async function upsertOAuthMember(input: {
  email?: string | null;
  name?: string | null;
  provider: string;
}) {
  const email = normalizeEmail(input.email);
  if (!email) return null;
  const provider: MemberProvider =
    input.provider === "twitter" ? "twitter" : "google";

  return withLock(async () => {
    const path = resolveStorePath();
    const store = await readStore(path);
    const existing = store.members.find((m) => m.email === email);
    if (existing) {
      if (input.name?.trim() && existing.name !== input.name.trim()) {
        existing.name = input.name.trim();
        await writeStore(path, store);
      }
      return existing;
    }
    const member: StoredMember = {
      id: `member-${randomUUID()}`,
      email,
      name: input.name?.trim() || email,
      provider,
      createdAt: new Date().toISOString(),
    };
    store.members.push(member);
    await writeStore(path, store);
    return member;
  });
}

export async function createAccessRequest(input: {
  name: string;
  email: string;
  provider: string;
  note?: string;
}): Promise<{ ok: true; request: AccessRequest } | { ok: false; error: string }> {
  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const note = (input.note ?? "").trim();
  if (!name) return { ok: false, error: "Name is required." };
  if (!isValidEmail(email)) return { ok: false, error: "Enter a valid email." };
  if (note.length > 2000) {
    return { ok: false, error: "Note must be at most 2000 characters." };
  }

  return withLock(async () => {
    const path = resolveStorePath();
    const store = await readStore(path);
    const existing = store.accessRequests.find(
      (r) => r.email === email && r.status === "pending",
    );
    const request: AccessRequest = existing
      ? {
          ...existing,
          name,
          provider: input.provider.trim() || existing.provider,
          note: note || existing.note,
          createdAt: new Date().toISOString(),
        }
      : {
          id: `access-${randomUUID()}`,
          name,
          email,
          provider: input.provider.trim() || "unknown",
          note,
          createdAt: new Date().toISOString(),
          status: "pending",
        };
    if (existing) {
      store.accessRequests = store.accessRequests.map((r) =>
        r.id === existing.id ? request : r,
      );
    } else {
      store.accessRequests.unshift(request);
    }
    await writeStore(path, store);
    return { ok: true, request };
  });
}

export async function listAccessRequests() {
  const store = await readStore(resolveStorePath());
  return [...store.accessRequests].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  );
}

function upsertSameEmail(
  kind: FormKind,
): kind is "saturday_note" | "shop_waitlist" {
  return kind === "saturday_note" || kind === "shop_waitlist";
}

export async function createFormSubmission(input: {
  kind: FormKind;
  name: string;
  email: string;
  message: string;
  source: string;
}): Promise<{ ok: true; submission: FormSubmission }> {
  return withLock(async () => {
    const path = resolveStorePath();
    const store = await readStore(path);
    const now = new Date().toISOString();
    const existing = upsertSameEmail(input.kind)
      ? store.formSubmissions.find(
          (row) => row.kind === input.kind && row.email === input.email,
        )
      : undefined;
    const submission: FormSubmission = existing
      ? {
          ...existing,
          name: input.name || existing.name,
          message: input.message || existing.message,
          source: input.source || existing.source,
          updatedAt: now,
        }
      : {
          id: `form-${randomUUID()}`,
          kind: input.kind,
          name: input.name,
          email: input.email,
          message: input.message,
          source: input.source,
          createdAt: now,
          updatedAt: now,
        };
    if (existing) {
      store.formSubmissions = store.formSubmissions.map((row) =>
        row.id === existing.id ? submission : row,
      );
    } else {
      store.formSubmissions.unshift(submission);
    }
    await writeStore(path, store);
    return { ok: true, submission };
  });
}

export async function listFormSubmissions() {
  const store = await readStore(resolveStorePath());
  return sortFormSubmissions(store.formSubmissions);
}
