import type { IntentFields } from "@/lib/intent/rules";
import {
  type ChildProgress,
  type PathStation,
  type PortionHorizon,
  type PortionItemDraft,
  asHorizon,
  horizonLabel,
} from "./rules.ts";

function norm(value: string) {
  return value.toLowerCase().trim();
}

function coveredSet(progress: ChildProgress) {
  const keys = new Set(progress.covered.map(norm).filter(Boolean));
  if (progress.welcomeWatched) keys.add("home:welcome");
  return keys;
}

export function remainingStations(pathItems: PathStation[], progress: ChildProgress) {
  const covered = coveredSet(progress);
  return pathItems.filter((item) => {
    const title = norm(item.title);
    const lesson = item.composerLessonId ? norm(item.composerLessonId) : "";
    if (!title) return false;
    if (covered.has(title)) return false;
    if (lesson && covered.has(lesson)) return false;
    return true;
  });
}

export function horizonFromIntent(intent: IntentFields | null, fallback?: unknown): PortionHorizon {
  if (typeof fallback === "string" && fallback.trim()) return asHorizon(fallback);
  return asHorizon(intent?.timeHorizon ?? "week");
}

function sliceSize(horizon: PortionHorizon) {
  return horizon === "module" ? 4 : 3;
}

export function sliceNextPortion(opts: {
  remaining: PathStation[];
  horizon: PortionHorizon;
  intent: IntentFields | null;
}): PortionItemDraft[] {
  const preferred = new Set((opts.intent?.tags.next ?? []).map(norm).filter(Boolean));
  const subjectHint = (opts.intent?.subjects ?? []).map(norm);
  let pool = opts.remaining;
  if (opts.horizon === "module") {
    const firstSubject = pool[0]?.subject || opts.intent?.subjects[0] || "";
    if (firstSubject) {
      const same = pool.filter((item) => norm(item.subject) === norm(firstSubject));
      if (same.length) pool = same;
    }
  }
  const ranked = [...pool].sort((a, b) => {
    const aPref = preferred.has(norm(a.title)) ? 0 : 1;
    const bPref = preferred.has(norm(b.title)) ? 0 : 1;
    if (aPref !== bPref) return aPref - bPref;
    const aSub = subjectHint.includes(norm(a.subject)) ? 0 : 1;
    const bSub = subjectHint.includes(norm(b.subject)) ? 0 : 1;
    if (aSub !== bSub) return aSub - bSub;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
  return ranked.slice(0, sliceSize(opts.horizon)).map((item, index) => ({
    sortOrder: index + 1,
    title: item.title,
    subject: item.subject,
    reason:
      item.reason ||
      `Remaining on the accepted path for ${horizonLabel(opts.horizon)}`,
    source: "remaining",
    pathItemId: item.id ?? null,
    composerLessonId: item.composerLessonId,
    composerUnitId: item.composerUnitId,
  }));
}

export function portionTitle(horizon: PortionHorizon, items: PortionItemDraft[], intent: IntentFields | null) {
  const first = items[0]?.title || intent?.subjects[0] || "next work";
  return `${horizonLabel(horizon)}: ${first}`.slice(0, 400);
}

export function portionReason(opts: {
  horizon: PortionHorizon;
  remainingCount: number;
  items: PortionItemDraft[];
  intent: IntentFields | null;
  progress: ChildProgress;
}) {
  const goal = opts.intent?.goals[0] || opts.intent?.subjects[0] || "parent intent";
  const notes = opts.progress.notes[0] ? ` Parent note: ${opts.progress.notes[0].slice(0, 80)}.` : "";
  const covered = opts.progress.covered.length
    ? ` ${opts.progress.covered.length} covered event${opts.progress.covered.length === 1 ? "" : "s"}.`
    : "";
  return `Suggest ${horizonLabel(opts.horizon)} from ${opts.remainingCount} remaining station${
    opts.remainingCount === 1 ? "" : "s"
  } for ${goal}.${covered}${notes}`.slice(0, 400);
}
