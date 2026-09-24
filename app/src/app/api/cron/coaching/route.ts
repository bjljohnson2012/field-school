import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { and, eq, isNull, lte, or } from "drizzle-orm";
import { NextResponse } from "next/server";
import { selectQuizQuestions } from "@/lib/ai/prompts/questions";
import { generateWeeklyBrief, type WeeklyBriefInput } from "@/lib/ai/prompts/loop";
import { logCoachingCron } from "@/lib/coaching/log";
import { hashToken } from "@/lib/coaching/quiz-token";
import { requireCoachingWrite } from "@/lib/coaching/writes";
import { getDb } from "@/lib/db/client";
import {
  adHocQuizzes,
  coachingLinks,
  coachingProfiles,
  members,
  memberships,
  questions,
  quizSchedules,
  skillStates,
  skills,
} from "@/lib/db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export const CRON_JOBS = ["quizzes", "briefs", "all"] as const;
export type CronJob = (typeof CRON_JOBS)[number];
export type CronBranch = "quizzes" | "briefs";

const QUESTIONS_PER_QUIZ = 8;
const QUIZ_ORIGIN = "https://portal.fieldschool.ai";

export type CoachingCronDeps = {
  env?: NodeJS.ProcessEnv;
  requireWrite?: (env: NodeJS.ProcessEnv) => Response | null;
  runQuizzes?: () => Promise<number>;
  runBriefs?: () => Promise<number>;
  log?: (input: { branch?: string | null; rowsChanged?: number | null }) => void;
};

export function bearerMatches(authorization: string | null, secret: string | undefined): boolean {
  const expected = typeof secret === "string" ? secret.trim() : "";
  if (!expected) return false;
  const header = authorization ?? "";
  const prefix = "Bearer ";
  if (!header.startsWith(prefix)) return false;
  const provided = header.slice(prefix.length);
  const left = createHash("sha256").update(provided).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function parseCronJob(value: unknown): CronJob | "missing" | "invalid" {
  if (value == null || typeof value !== "object" || Array.isArray(value)) return "invalid";
  if (!Object.prototype.hasOwnProperty.call(value, "job")) return "missing";
  const job = (value as { job?: unknown }).job;
  if (job == null) return "missing";
  if (job === "quizzes" || job === "briefs" || job === "all") return job;
  return "invalid";
}

export function branchesFor(job: CronJob): CronBranch[] {
  if (job === "all") return ["quizzes", "briefs"];
  return [job];
}

export function nextRunAfter(from: Date, cadence: string): Date {
  const next = new Date(from.getTime());
  const key = cadence.trim().toLowerCase();
  if (key === "daily" || key === "day") next.setUTCDate(next.getUTCDate() + 1);
  else if (key === "weekly" || key === "week") next.setUTCDate(next.getUTCDate() + 7);
  else if (key === "quarterly" || key === "quarter") next.setUTCMonth(next.getUTCMonth() + 3);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

function finiteCount(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

async function readJob(request: Request): Promise<CronJob | "invalid"> {
  const text = await request.text();
  if (!text.trim()) return "all";
  try {
    const parsed = parseCronJob(JSON.parse(text));
    if (parsed === "missing") return "all";
    return parsed;
  } catch {
    return "invalid";
  }
}

export async function handleCoachingCron(
  request: Request,
  deps: CoachingCronDeps = {},
): Promise<Response> {
  const env = deps.env ?? process.env;
  if (!bearerMatches(request.headers.get("authorization"), env.CRON_SECRET)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const requireWrite = deps.requireWrite ?? requireCoachingWrite;
  const blocked = requireWrite(env);
  if (blocked) return blocked;

  const job = await readJob(request);
  if (job === "invalid") {
    return NextResponse.json({ error: "invalid_job" }, { status: 400 });
  }

  const runQuizzes = deps.runQuizzes ?? runDueQuizSchedules;
  const runBriefs = deps.runBriefs ?? runDueWeeklyBriefs;
  const log = deps.log ?? logCoachingCron;
  let rowsChanged = 0;
  let failed = false;
  for (const branch of branchesFor(job)) {
    try {
      const count = finiteCount(await (branch === "quizzes" ? runQuizzes() : runBriefs()));
      log({ branch, rowsChanged: count });
      rowsChanged += count;
    } catch {
      failed = true;
      log({ branch, rowsChanged: 0 });
    }
  }
  if (failed) return NextResponse.json({ error: "cron_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, job, rowsChanged });
}

export async function POST(request: Request) {
  return handleCoachingCron(request);
}

function mailConfigured(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() || env.SMTP_HOST?.trim());
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function tagsOf(value: unknown): string[] {
  return stringList(value).slice(0, 10);
}

async function deliverQuizLink(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<boolean> {
  const from = process.env.RESEND_FROM?.trim() || process.env.SMTP_FROM?.trim() || "Field School <note@fieldschool.ai>";
  const key = process.env.RESEND_API_KEY?.trim();
  if (key) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });
    return response.ok;
  }
  const host = process.env.SMTP_HOST?.trim();
  if (!host) return false;
  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
  return true;
}

export async function runDueQuizSchedules(now = new Date()): Promise<number> {
  if (!mailConfigured()) return 0;
  const db = getDb();
  const due = await db
    .select()
    .from(quizSchedules)
    .where(and(eq(quizSchedules.active, true), lte(quizSchedules.nextRunAt, now)))
    .limit(50);

  let changed = 0;
  for (const schedule of due) {
    try {
      changed += await runOneQuizSchedule(db, schedule, now);
    } catch {
      /* one schedule does not fail the batch; the error text stays off the log */
    }
  }
  return changed;
}

async function runOneQuizSchedule(
  db: ReturnType<typeof getDb>,
  schedule: typeof quizSchedules.$inferSelect,
  now: Date,
): Promise<number> {
  const [person] = await db
    .select({ name: members.name, email: members.email })
    .from(memberships)
    .innerJoin(members, eq(members.id, memberships.memberId))
    .where(and(eq(memberships.id, schedule.subjectMembershipId), eq(memberships.orgId, schedule.orgId)))
    .limit(1);
  if (!person?.email) return 0;

  const [link] = await db
    .select({ coachMembershipId: coachingLinks.coachMembershipId })
    .from(coachingLinks)
    .where(
      and(
        eq(coachingLinks.orgId, schedule.orgId),
        eq(coachingLinks.subjectMembershipId, schedule.subjectMembershipId),
      ),
    )
    .limit(1);
  const authorMembershipId = link?.coachMembershipId ?? schedule.subjectMembershipId;

  const scores = await db
    .select({ slug: skills.slug, score: skillStates.score })
    .from(skillStates)
    .innerJoin(skills, eq(skills.id, skillStates.skillId))
    .where(
      and(eq(skillStates.orgId, schedule.orgId), eq(skillStates.membershipId, schedule.subjectMembershipId)),
    );
  const skillScores = scores
    .map((row) => ({ category: row.slug, score: Number(row.score) }))
    .filter((row) => Number.isFinite(row.score));
  const focusAreas = [...skillScores]
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map((row) => row.category);

  const [profile] = await db
    .select({ weaknesses: coachingProfiles.weaknesses })
    .from(coachingProfiles)
    .where(
      and(
        eq(coachingProfiles.orgId, schedule.orgId),
        eq(coachingProfiles.membershipId, schedule.subjectMembershipId),
      ),
    )
    .limit(1);

  const bank = await db
    .select({
      id: questions.id,
      text: questions.text,
      tags: questions.tags,
      questionType: questions.questionType,
      category: questions.category,
    })
    .from(questions)
    .where(and(eq(questions.active, true), or(eq(questions.orgId, schedule.orgId), isNull(questions.orgId))))
    .limit(200);

  const pool = bank.map((row) => ({
    id: row.id,
    text: row.text.slice(0, 200),
    tags: tagsOf(row.tags),
    questionType: row.questionType,
    category: row.category,
  }));

  let questionIds: string[] = [];
  if (pool.length > 0) {
    try {
      const picked = await selectQuizQuestions({
        aeName: person.name,
        weaknesses: stringList(profile?.weaknesses),
        skillScores,
        focusAreas,
        candidateQuestions: pool.slice(0, 80),
        count: QUESTIONS_PER_QUIZ,
      });
      const allowed = new Set(pool.map((row) => row.id));
      questionIds = stringList(picked?.questionIds).filter((id) => allowed.has(id)).slice(0, QUESTIONS_PER_QUIZ);
    } catch {
      questionIds = [];
    }
    if (questionIds.length === 0) {
      questionIds = pool.slice(0, QUESTIONS_PER_QUIZ).map((row) => row.id);
    }
  }

  const advanceTo = nextRunAfter(now, schedule.cadence);
  if (questionIds.length === 0) {
    await db.update(quizSchedules).set({ nextRunAt: advanceTo }).where(eq(quizSchedules.id, schedule.id));
    return 1;
  }

  const token = randomBytes(24).toString("hex");
  const tokenHash = hashToken(token);
  const first = person.name.split(" ")[0] || "there";
  const title = `${schedule.cadence.trim().toLowerCase() || "scheduled"} check-in for ${first}`.slice(0, 180);
  const quizUrl = `${QUIZ_ORIGIN}/quiz/${token}`;
  const subject = title;
  const text = `Hi ${first},\n\nYour check-in is ready.\n\n${quizUrl}\n`;
  const html = `<p>Hi ${first},</p><p><a href="${quizUrl}">Take the quiz</a></p>`;
  const sent = await deliverQuizLink({ to: person.email, subject, text, html });
  if (!sent) return 0;

  await db.transaction(async (tx) => {
    await tx.insert(adHocQuizzes).values({
      orgId: schedule.orgId,
      subjectMembershipId: schedule.subjectMembershipId,
      authorMembershipId,
      title,
      tokenHash,
      status: "pending",
      questionIds,
    });
    await tx.update(quizSchedules).set({ nextRunAt: advanceTo }).where(eq(quizSchedules.id, schedule.id));
  });
  return 2;
}

/**
 * Campus has no weekly-brief subscriber or last-sent column.
 * The branch still runs and logs. It does not invent recipients.
 */
export async function runDueWeeklyBriefs(): Promise<number> {
  const due: WeeklyBriefInput[] = [];
  let changed = 0;
  for (const input of due) {
    await generateWeeklyBrief(input);
    changed += 1;
  }
  return changed;
}
