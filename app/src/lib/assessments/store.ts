import { createHash } from "node:crypto";
import { and, desc, eq, inArray, isNotNull, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { memberProfiles, memberships } from "@/lib/db/schema";
import { assessmentPlacements, assessmentRuns } from "@/lib/db/schema-profile-m2";
import { evaluate, neutralPrior, type Answer, type Prior, type RunState } from "./engine";
import { recordTrackGate } from "./gate-sink";
import {
  answerFit,
  answersDigestInput,
  isExpired,
  pct,
  priorFromBearing,
  readAnswers,
  readPrior,
  runView,
  type RunView,
} from "./model";
import { applyProfileM2Sql } from "./sql";
import { TRACK_IDS, isTrackId, trackDef, type TrackId } from "./tracks";

export type Owner = { memberId: string; name: string };

type RunRow = typeof assessmentRuns.$inferSelect;

function digest(bankVersion: string, answers: readonly Answer[]) {
  return createHash("sha256").update(answersDigestInput(bankVersion, answers)).digest("hex");
}

/** The latest Field Pattern Bearing on any of the User's own memberships. */
async function patternPrior(memberId: string): Promise<Prior | null> {
  const db = getDb();
  const [row] = await db
    .select({ correspondence: memberProfiles.correspondence })
    .from(memberProfiles)
    .innerJoin(memberships, eq(memberships.id, memberProfiles.membershipId))
    .where(and(eq(memberships.memberId, memberId), isNotNull(memberProfiles.lastRunAt)))
    .orderBy(desc(memberProfiles.lastRunAt))
    .limit(1);
  const blob = row?.correspondence;
  if (typeof blob !== "object" || blob === null) return null;
  return priorFromBearing(trackDef("personality"), Object.getOwnPropertyDescriptor(blob, "dims")?.value);
}

type LoadedRun = { row: RunRow; track: TrackId; prior: Prior; answers: Answer[] };

function load(row: RunRow): LoadedRun {
  if (!isTrackId(row.track)) throw new Error(`assessment_run_track_invalid:${row.id}`);
  const def = trackDef(row.track);
  const prior = readPrior(def, row.prior);
  const answers = readAnswers(def, row.answers);
  if (!prior || !answers) throw new Error(`assessment_run_unreadable:${row.id}`);
  return { row, track: row.track, prior, answers };
}

/** Past the retention window an unfinished run keeps only the hash of its answers. */
async function expireStale(memberId: string, now: Date) {
  const db = getDb();
  const open = await db
    .select()
    .from(assessmentRuns)
    .where(and(eq(assessmentRuns.memberId, memberId), eq(assessmentRuns.status, "in_progress")));
  for (const row of open) {
    if (!isExpired(row.updatedAt, now)) continue;
    const run = load(row);
    await db
      .update(assessmentRuns)
      .set({
        status: "expired",
        answers: [],
        answersHash: digest(row.bankVersion, run.answers),
        resumeItemKey: null,
        updatedAt: now,
      })
      .where(and(eq(assessmentRuns.id, row.id), eq(assessmentRuns.status, "in_progress")));
  }
}

function lockedRows(run: LoadedRun, state: RunState, now: Date) {
  return state.placements
    .filter((placement) => placement.kind !== "open")
    .map((placement) => ({
      runId: run.row.id,
      memberId: run.row.memberId,
      track: run.track,
      taxonomy: placement.taxonomy,
      category: placement.category,
      confidencePct: String(pct(placement.confidence)),
      locked: placement.kind === "locked",
      unsettled: placement.kind === "unsettled",
      answered: placement.answered,
      lockedAt: placement.kind === "locked" ? now : null,
    }));
}

async function finishGate(owner: Owner, row: RunRow) {
  if (!row.completedAt || row.gateRecordedAt || !isTrackId(row.track)) return;
  await recordTrackGate({
    owner,
    track: row.track,
    gate: trackDef(row.track).gate,
    runId: row.id,
    completedAt: row.completedAt,
  });
  await getDb()
    .update(assessmentRuns)
    .set({ gateRecordedAt: new Date() })
    .where(and(eq(assessmentRuns.id, row.id), isNull(assessmentRuns.gateRecordedAt)));
}

/** Resumes the open run for this track, or starts one. Two devices racing land on the same run. */
export async function openRun(owner: Owner, track: TrackId, now = new Date()): Promise<RunView> {
  await applyProfileM2Sql();
  await expireStale(owner.memberId, now);
  const db = getDb();
  const def = trackDef(track);
  const prior = track === "personality" ? (await patternPrior(owner.memberId)) ?? neutralPrior(def) : neutralPrior(def);
  const first = evaluate(def, prior, []);
  await db
    .insert(assessmentRuns)
    .values({
      memberId: owner.memberId,
      track,
      bankVersion: def.bankVersion,
      prior,
      resumeItemKey: first.kind === "asking" ? first.next.key : null,
      startedAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing();
  const [row] = await db
    .select()
    .from(assessmentRuns)
    .where(
      and(eq(assessmentRuns.memberId, owner.memberId), eq(assessmentRuns.track, track), eq(assessmentRuns.status, "in_progress")),
    )
    .limit(1);
  if (!row) throw new Error("assessment_run_open_missing");
  const run = load(row);
  return runView(def, row.id, evaluate(def, run.prior, run.answers));
}

export type AnswerResult =
  | { ok: true; view: RunView }
  | { ok: false; error: "run_not_found" | "run_finished" | "answer_not_expected"; view?: RunView };

async function ownRun(owner: Owner, runId: string) {
  const [row] = await getDb()
    .select()
    .from(assessmentRuns)
    .where(and(eq(assessmentRuns.id, runId), eq(assessmentRuns.memberId, owner.memberId)))
    .limit(1);
  return row ?? null;
}

async function storedPlacementView(row: RunRow): Promise<RunView> {
  if (!isTrackId(row.track)) throw new Error(`assessment_run_track_invalid:${row.id}`);
  const def = trackDef(row.track);
  const rows = await getDb().select().from(assessmentPlacements).where(eq(assessmentPlacements.runId, row.id));
  return {
    runId: row.id,
    track: def.id,
    status: row.status === "complete" || row.status === "ceiling_unsettled" ? row.status : "expired",
    answered: row.questionsAsked,
    ceiling: def.ceiling,
    next: null,
    meter: { progress: 1, taxonomies: def.taxonomies.map((t) => ({ taxonomy: t.id, progress: 1, settled: true })) },
    placements: def.taxonomies.flatMap((taxonomy) => {
      const stored = rows.find((r) => r.taxonomy === taxonomy.id);
      const category = taxonomy.categories.find((c) => c.id === stored?.category);
      if (!stored || !category) return [];
      return [
        {
          taxonomy: taxonomy.id,
          label: taxonomy.label,
          category: category.id,
          categoryLabel: category.label,
          confidencePct: Number(stored.confidencePct),
          state: stored.locked ? ("locked" as const) : ("unsettled" as const),
        },
      ];
    }),
  };
}

export async function readRun(owner: Owner, runId: string): Promise<RunView | null> {
  await applyProfileM2Sql();
  const row = await ownRun(owner, runId);
  if (!row) return null;
  if (row.status !== "in_progress") return storedPlacementView(row);
  const run = load(row);
  const def = trackDef(run.track);
  return runView(def, row.id, evaluate(def, run.prior, run.answers));
}

/**
 * Accepts only the answer to the item the run is asking. A write lands only if no other
 * device has answered in between; a repeat of the last stored answer returns the same view.
 * Finishing stores every placement, hashes and drops the raw answers, then sets the gate.
 */
export async function answerRun(owner: Owner, runId: string, answer: Answer, now = new Date()): Promise<AnswerResult> {
  await applyProfileM2Sql();
  const row = await ownRun(owner, runId);
  if (!row) return { ok: false, error: "run_not_found" };
  if (row.status !== "in_progress") return { ok: false, error: "run_finished", view: await storedPlacementView(row) };
  const run = load(row);
  const def = trackDef(run.track);
  const before = evaluate(def, run.prior, run.answers);
  const fit = answerFit(before, run.answers, answer);
  if (fit === "repeat") return { ok: true, view: runView(def, row.id, before) };
  if (fit === "reject") return { ok: false, error: "answer_not_expected", view: runView(def, row.id, before) };

  const answers = [...run.answers, answer];
  const after = evaluate(def, run.prior, answers);
  const db = getDb();
  const finished = after.kind === "finished";
  const written = await db.transaction(async (tx) => {
    const updated = await tx
      .update(assessmentRuns)
      .set(
        finished
          ? {
              status: after.outcome,
              answers: [],
              answersHash: digest(row.bankVersion, answers),
              questionsAsked: answers.length,
              resumeItemKey: null,
              completedAt: now,
              updatedAt: now,
            }
          : {
              answers,
              questionsAsked: answers.length,
              resumeItemKey: after.next.key,
              updatedAt: now,
            },
      )
      .where(
        and(
          eq(assessmentRuns.id, row.id),
          eq(assessmentRuns.status, "in_progress"),
          eq(assessmentRuns.questionsAsked, run.answers.length),
        ),
      )
      .returning();
    if (!updated[0]) return null;
    const placements = lockedRows(run, after, now);
    if (placements.length) {
      await tx.insert(assessmentPlacements).values(placements).onConflictDoNothing();
    }
    return updated[0];
  });
  if (!written) {
    const latest = await readRun(owner, runId);
    return latest ? { ok: true, view: latest } : { ok: false, error: "run_not_found" };
  }
  if (finished) await finishGate(owner, written);
  return { ok: true, view: runView(def, row.id, after) };
}

export type TrackOverview = {
  track: TrackId;
  label: string;
  gate: string;
  openRunId: string | null;
  openAnswered: number;
  lastCompletedAt: string | null;
  latest: RunView | null;
};

/** Per track: the open run if any, and the placements of the latest finished run. */
export async function wizardOverview(owner: Owner): Promise<TrackOverview[]> {
  await applyProfileM2Sql();
  await expireStale(owner.memberId, new Date());
  const db = getDb();
  const rows = await db
    .select()
    .from(assessmentRuns)
    .where(and(eq(assessmentRuns.memberId, owner.memberId), inArray(assessmentRuns.status, ["in_progress", "complete", "ceiling_unsettled"])))
    .orderBy(desc(assessmentRuns.completedAt));
  for (const row of rows) await finishGate(owner, row);
  return Promise.all(
    TRACK_IDS.map(async (track) => {
      const def = trackDef(track);
      const open = rows.find((row) => row.track === track && row.status === "in_progress") ?? null;
      const done = rows.find((row) => row.track === track && row.completedAt) ?? null;
      return {
        track,
        label: def.label,
        gate: def.gate,
        openRunId: open?.id ?? null,
        openAnswered: open?.questionsAsked ?? 0,
        lastCompletedAt: done?.completedAt?.toISOString() ?? null,
        latest: done ? await storedPlacementView(done) : null,
      };
    }),
  );
}
