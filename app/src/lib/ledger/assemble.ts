import {
  type ChildProgress,
  type LedgerStation,
  type LedgerUnitDraft,
  type LedgerUnitStatus,
  type PersistedUnit,
} from "./rules.ts";

function norm(value: string) {
  return value.toLowerCase().trim();
}

function coveredSet(progress: ChildProgress) {
  const keys = new Set(progress.covered.map(norm).filter(Boolean));
  if (progress.welcomeWatched) keys.add("home:welcome");
  return keys;
}

function startedSet(progress: ChildProgress) {
  return new Set((progress.started ?? []).map(norm).filter(Boolean));
}

export function stationCovered(station: LedgerStation, progress: ChildProgress) {
  const covered = coveredSet(progress);
  const title = norm(station.title);
  const lesson = station.composerLessonId ? norm(station.composerLessonId) : "";
  if (!title) return false;
  return covered.has(title) || Boolean(lesson && covered.has(lesson));
}

export function stationStarted(station: LedgerStation, progress: ChildProgress) {
  const started = startedSet(progress);
  const title = norm(station.title);
  const lesson = station.composerLessonId ? norm(station.composerLessonId) : "";
  return started.has(title) || Boolean(lesson && started.has(lesson));
}

function persistedFor(station: LedgerStation, persisted: PersistedUnit[]) {
  const title = norm(station.title);
  const lesson = station.composerLessonId ? norm(station.composerLessonId) : "";
  return (
    persisted.find((row) => norm(row.title) === title) ||
    persisted.find((row) => lesson && norm(row.title) === lesson) ||
    null
  );
}

export function statusForStation(
  station: LedgerStation,
  progress: ChildProgress,
  persisted: PersistedUnit[] = [],
): LedgerUnitStatus {
  const prior = persistedFor(station, persisted);
  if (stationCovered(station, progress) || prior?.status === "completed") return "completed";
  if (stationStarted(station, progress) || prior?.status === "in_progress") return "in_progress";
  return "recommended";
}

export function mergeStations(opts: {
  path: LedgerStation[];
  portion: LedgerStation[];
  extra?: LedgerStation[];
}): LedgerStation[] {
  const out: LedgerStation[] = [];
  const seen = new Set<string>();
  const portionKeys = new Set(opts.portion.map((item) => norm(item.title)).filter(Boolean));
  for (const item of [...opts.path, ...opts.portion, ...(opts.extra ?? [])]) {
    const key = norm(item.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push({
      ...item,
      onPortion: item.onPortion || portionKeys.has(key),
    });
  }
  return out;
}

export function assembleLedgerUnits(opts: {
  stations: LedgerStation[];
  progress: ChildProgress;
  persisted?: PersistedUnit[];
}): LedgerUnitDraft[] {
  const persisted = opts.persisted ?? [];
  return opts.stations
    .filter((item) => item.title.trim())
    .map((item, index) => {
      const prior = persistedFor(item, persisted);
      const status = statusForStation(item, opts.progress, persisted);
      return {
        sortOrder: index + 1,
        title: item.title,
        subject: item.subject,
        status,
        source:
          status === "completed" || status === "in_progress"
            ? prior?.status === status
              ? "parent"
              : "event"
            : item.onPortion
              ? "portion"
              : "path",
        pathItemId: item.pathItemId ?? item.id ?? null,
        portionItemId: item.portionItemId ?? null,
        composerLessonId: item.composerLessonId,
        composerUnitId: item.composerUnitId,
        confidence: prior?.confidence ?? "",
        flag: prior?.flag ?? "",
        startedAt: prior?.startedAt ?? null,
        completedAt: prior?.completedAt ?? null,
      };
    });
}

export function groupLedgerUnits(units: LedgerUnitDraft[]) {
  const completed = units.filter((unit) => unit.status === "completed");
  const inProgress = units.filter((unit) => unit.status === "in_progress");
  const recommended = units.filter((unit) => unit.status === "recommended");
  const next =
    recommended.find((unit) => unit.source === "portion") ?? recommended[0] ?? null;
  return { completed, inProgress, recommended, next };
}

export function ledgerSummary(units: LedgerUnitDraft[]) {
  const grouped = groupLedgerUnits(units);
  return {
    completed: grouped.completed.length,
    inProgress: grouped.inProgress.length,
    recommended: grouped.recommended.length,
    next: grouped.next?.title ?? null,
  };
}
