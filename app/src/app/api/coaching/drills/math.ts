import { COACHING_SKILLS } from "@/lib/campus-runtime/lessons";

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500, 10000];
const DAY_MS = 86_400_000;
const COACH_CAPS = new Set(["coach", "leader", "admin"]);

export type DrillShape = "AE" | "LEADER";

export type DrillSkill = {
  category: string;
  label: string;
  score: number | null;
};

export type DrillStats = {
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  progress: { current: number; needed: number; pct: number };
};

export function pointsToLevel(totalPoints: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i += 1) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

export function pointsToNextLevel(totalPoints: number) {
  const level = pointsToLevel(totalPoints);
  const floor = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const ceiling = LEVEL_THRESHOLDS[level] ?? floor + 5000;
  const within = totalPoints - floor;
  const span = ceiling - floor;
  return {
    current: within,
    needed: span,
    pct: Math.min(100, Math.round((within / Math.max(1, span)) * 100)),
  };
}

export function scoreToPoints(aiScore: number): number {
  if (aiScore >= 90) return 50 + Math.round(aiScore * 0.6);
  if (aiScore >= 70) return 30 + Math.round(aiScore * 0.4);
  if (aiScore >= 50) return 15 + Math.round(aiScore * 0.2);
  return 5;
}

export function drillsForOrg(orgKind: string): boolean {
  const kind = orgKind.trim().toLowerCase();
  return kind === "sales" || kind === "company";
}

export function drillShape(stance: string, capabilities: readonly string[]): DrillShape {
  if (COACH_CAPS.has(stance)) return "LEADER";
  if (capabilities.some((capability) => COACH_CAPS.has(capability))) return "LEADER";
  return "AE";
}

export function skillsForShape(shape: DrillShape) {
  const audience = shape === "LEADER" ? "coach" : "learner";
  return COACHING_SKILLS.filter((skill) => skill.audience === audience);
}

export function improveLabel(features: unknown): string {
  if (!features || typeof features !== "object" || Array.isArray(features)) return "Improve";
  const raw = (features as { improveButtonLabel?: unknown }).improveButtonLabel;
  if (typeof raw !== "string") return "Improve";
  const label = raw.trim().slice(0, 40);
  return label || "Improve";
}

export function rubricText(name: string, rubric: unknown): string {
  if (rubric && typeof rubric === "object" && !Array.isArray(rubric)) {
    const row = rubric as { whatGoodLooksLike?: unknown; what_good_looks_like?: unknown; text?: unknown };
    const prose = row.whatGoodLooksLike ?? row.what_good_looks_like ?? row.text;
    if (typeof prose === "string" && prose.trim()) return prose.trim();
  }
  return `${name}. A strong response is specific and names the next step.`;
}

export function foreignSubject(callerMembershipId: string, body: Record<string, unknown>): boolean {
  for (const key of ["membershipId", "actorMembershipId", "subjectMembershipId"]) {
    const value = body[key];
    if (typeof value === "string" && value.trim() && value.trim() !== callerMembershipId) return true;
  }
  return false;
}

function utcDay(date: Date): number {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function summarizeAttempts(
  rows: { pointsAwarded: number; createdAt: Date; status: string }[],
  now = new Date(),
): DrillStats {
  const done = rows.filter((row) => row.status === "completed");
  const totalPoints = done.reduce((sum, row) => sum + (Number(row.pointsAwarded) || 0), 0);
  const days = [...new Set(done.map((row) => utcDay(new Date(row.createdAt))))].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev = -1;
  for (const day of days) {
    run = prev >= 0 && day - prev === DAY_MS ? run + 1 : 1;
    if (run > longest) longest = run;
    prev = day;
  }
  const today = utcDay(now);
  const latest = days.length ? days[days.length - 1] : null;
  let current = 0;
  if (latest === today || latest === today - DAY_MS) {
    const set = new Set(days);
    let cursor = latest as number;
    while (set.has(cursor)) {
      current += 1;
      cursor -= DAY_MS;
    }
  }
  return {
    totalPoints,
    level: pointsToLevel(totalPoints),
    currentStreak: current,
    longestStreak: longest,
    progress: pointsToNextLevel(totalPoints),
  };
}
