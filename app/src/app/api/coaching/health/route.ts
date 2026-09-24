import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { resolveApiKey } from "@/lib/ai/client";
import { getDb, getSql } from "@/lib/db/client";
import { coachingProfiles } from "@/lib/db/schema";
import {
  alertUnretriedFailedSyntheses,
  type FailedSynthesisRow,
} from "@/lib/mail/operator-alert";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export type CoachingHealthDeps = {
  pingDatabase?: () => Promise<boolean>;
  aiEnvReady?: () => boolean;
  loadFailedSyntheses?: () => Promise<FailedSynthesisRow[]>;
  sendOperatorAlert?: (row: FailedSynthesisRow) => Promise<{ emailed: boolean }>;
  now?: Date;
};

const healthDeps: CoachingHealthDeps = {};

export function setCoachingHealthOverrides(next: CoachingHealthDeps) {
  Object.assign(healthDeps, next);
}

export function clearCoachingHealthOverrides() {
  for (const key of Object.keys(healthDeps)) {
    delete healthDeps[key as keyof CoachingHealthDeps];
  }
}

export function coachingAiEnvReady(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(resolveApiKey(env));
}

export async function pingCoachingDatabase() {
  try {
    const sqlClient = getSql();
    await sqlClient`select 1`;
    return true;
  } catch {
    return false;
  }
}

export async function loadFailedSynthesisRows(): Promise<FailedSynthesisRow[]> {
  const db = getDb();
  return db
    .select({
      orgId: coachingProfiles.orgId,
      membershipId: coachingProfiles.membershipId,
      synthesisStatus: coachingProfiles.synthesisStatus,
      updatedAt: coachingProfiles.updatedAt,
    })
    .from(coachingProfiles)
    .where(
      and(
        eq(coachingProfiles.synthesisStatus, "failed"),
        sql`${coachingProfiles.updatedAt} > now() - interval '15 minutes'`,
      ),
    );
}

export async function runCoachingHealth(deps: CoachingHealthDeps = healthDeps) {
  const ping = deps.pingDatabase ?? pingCoachingDatabase;
  const aiReady = deps.aiEnvReady ?? (() => coachingAiEnvReady());
  const load = deps.loadFailedSyntheses ?? loadFailedSynthesisRows;
  let dbOk = false;
  let aiOk = false;
  try {
    dbOk = await ping();
  } catch {
    dbOk = false;
  }
  try {
    aiOk = Boolean(aiReady());
  } catch {
    aiOk = false;
  }
  if (dbOk) {
    try {
      const rows = await load();
      await alertUnretriedFailedSyntheses(rows, {
        now: deps.now,
        send: deps.sendOperatorAlert,
      });
    } catch {
      /* alert or scan failure does not change { ok } */
    }
  }
  return { ok: Boolean(dbOk && aiOk) };
}

export async function GET() {
  const body = await runCoachingHealth();
  return NextResponse.json({ ok: body.ok }, { status: 200 });
}
