import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const HIRE_PLAN_IDS = ["100", "200", "1000"] as const;
export const HIRE_AMOUNT_CENTS = {
  "100": 10000,
  "200": 20000,
  "1000": 100000,
} as const;

export type HirePlanId = (typeof HIRE_PLAN_IDS)[number];

export type HireActivationRow = {
  at: string;
  plan_id: HirePlanId;
  stripe_session_id: string;
  amount_cents: number;
  activated: true;
  metering: "/metering";
  play: "/play/lesson-spine";
  distribute: false;
  launch: "CLOSED 0/8";
};

export type HireActivationEvidence = {
  ok: true;
  hire: "activated";
  plans: typeof HIRE_PLAN_IDS;
  distribute: false;
  launch: "CLOSED 0/8";
  metering: "/metering";
  rows: HireActivationRow[];
};

function destPath() {
  if (process.env.HIRE_ACTIVATION_PATH?.trim()) {
    return process.env.HIRE_ACTIVATION_PATH.trim();
  }
  if (process.env.NODE_ENV === "production") {
    return "/app/data/hire-activation.json";
  }
  return join(process.cwd(), ".data", "hire-activation.json");
}

const PUBLIC_SEED = join(process.cwd(), "public/lessons/hls/hire-activation.json");

export function emptyHireActivation(): HireActivationEvidence {
  return {
    ok: true,
    hire: "activated",
    plans: HIRE_PLAN_IDS,
    distribute: false,
    launch: "CLOSED 0/8",
    metering: "/metering",
    rows: [],
  };
}

export function isHirePlanId(value: string | null | undefined): value is HirePlanId {
  return Boolean(value && (HIRE_PLAN_IDS as readonly string[]).includes(value));
}

export function publicHireRow(row: HireActivationRow) {
  return {
    at: row.at,
    plan_id: row.plan_id,
    stripe_session_id: row.stripe_session_id,
    amount_cents: row.amount_cents,
    activated: true as const,
    metering: row.metering,
    play: row.play,
    distribute: false as const,
    launch: row.launch,
  };
}

function parseEvidence(raw: string): HireActivationEvidence | null {
  try {
    const body = JSON.parse(raw) as HireActivationEvidence;
    return {
      ...emptyHireActivation(),
      ...body,
      distribute: false,
      launch: "CLOSED 0/8",
      rows: Array.isArray(body.rows)
        ? body.rows.filter((row) => isHirePlanId(row.plan_id) && row.activated)
        : [],
    };
  } catch {
    return null;
  }
}

export function readHireActivation(): HireActivationEvidence {
  for (const dest of [destPath(), PUBLIC_SEED]) {
    if (!existsSync(dest)) continue;
    const parsed = parseEvidence(readFileSync(dest, "utf8"));
    if (parsed) return parsed;
  }
  return emptyHireActivation();
}

export function findHireBySession(sessionId: string) {
  const id = sessionId.trim();
  if (!id) return null;
  return readHireActivation().rows.find((row) => row.stripe_session_id === id) ?? null;
}

export function activateLearnWithBenHire(input: {
  planId?: string | null;
  stripeSessionId?: string | null;
  amountTotal?: number | null;
}) {
  const planId = String(input.planId || "").trim();
  if (!isHirePlanId(planId)) {
    return { ok: false as const, error: "not_learn_with_ben" };
  }
  const sessionId = String(input.stripeSessionId || "").trim();
  if (!sessionId.startsWith("cs_")) {
    return { ok: false as const, error: "session_missing" };
  }
  const expected = HIRE_AMOUNT_CENTS[planId];
  if (
    typeof input.amountTotal === "number" &&
    Number.isFinite(input.amountTotal) &&
    input.amountTotal !== expected
  ) {
    return { ok: false as const, error: "amount_mismatch" };
  }
  const current = readHireActivation();
  const existing = current.rows.find((row) => row.stripe_session_id === sessionId);
  if (existing) {
    return { ok: true as const, created: false, row: existing, evidence: current };
  }
  const row: HireActivationRow = {
    at: new Date().toISOString(),
    plan_id: planId,
    stripe_session_id: sessionId,
    amount_cents: expected,
    activated: true,
    metering: "/metering",
    play: "/play/lesson-spine",
    distribute: false,
    launch: "CLOSED 0/8",
  };
  const next: HireActivationEvidence = {
    ...current,
    rows: [...current.rows, row],
  };
  const dest = destPath();
  mkdirSync(dirname(dest), { recursive: true });
  writeFileSync(dest, `${JSON.stringify(next, null, 2)}\n`);
  return { ok: true as const, created: true, row, evidence: next };
}
