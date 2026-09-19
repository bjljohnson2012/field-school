import type { IntentFields } from "@/lib/intent/rules";
import type { CatalogLesson, ChildProgress, PathItemDraft } from "./rules.ts";

function norm(value: string) {
  return value.toLowerCase().trim();
}

function coveredSet(progress: ChildProgress) {
  const keys = new Set(progress.covered.map(norm).filter(Boolean));
  for (const title of progress.priorTitles) keys.add(norm(title));
  if (progress.welcomeWatched) keys.add("home:welcome");
  return keys;
}

function haystack(lesson: CatalogLesson) {
  return [lesson.title, lesson.courseTitle, ...lesson.units.map((unit) => unit.title)]
    .map(norm)
    .join(" ");
}

function matchLesson(catalog: CatalogLesson[], needle: string) {
  const key = norm(needle);
  if (!key) return null;
  return (
    catalog.find((lesson) => haystack(lesson).includes(key)) ||
    catalog.find((lesson) => key.includes(norm(lesson.title)) && norm(lesson.title)) ||
    null
  );
}

export function assemblePathItems(input: {
  intent: IntentFields;
  progress: ChildProgress;
  catalog: CatalogLesson[];
  prompt?: string;
}): PathItemDraft[] {
  const items: PathItemDraft[] = [];
  const seen = new Set<string>();
  const covered = coveredSet(input.progress);
  const usedLessons = new Set<string>();

  const add = (draft: Omit<PathItemDraft, "sortOrder">) => {
    const key = norm(draft.title);
    if (!key || seen.has(key) || covered.has(key)) return false;
    if (draft.composerLessonId && usedLessons.has(draft.composerLessonId)) return false;
    seen.add(key);
    if (draft.composerLessonId) usedLessons.add(draft.composerLessonId);
    items.push({ ...draft, sortOrder: items.length + 1 });
    return true;
  };

  const bindCatalog = (needle: string, subject: string, reason: string) => {
    const lesson = matchLesson(input.catalog, needle);
    if (!lesson) return false;
    return add({
      title: lesson.title,
      subject,
      kind: "station",
      reason,
      source: "catalog",
      composerLessonId: lesson.id,
      composerUnitId: lesson.units[0]?.id ?? null,
    });
  };

  for (const subject of input.intent.subjects) {
    if (
      !bindCatalog(
        subject,
        subject,
        `Composer lesson bound to this child for subject ${subject}`,
      )
    ) {
      add({
        title: subject,
        subject,
        kind: "station",
        reason: "From parent intent subject",
        source: "intent",
        composerLessonId: null,
        composerUnitId: null,
      });
    }
  }

  for (const goal of input.intent.goals) {
    if (
      !bindCatalog(goal, input.intent.subjects[0] || "", `Composer lesson bound to this child for goal ${goal}`)
    ) {
      add({
        title: goal,
        subject: input.intent.subjects[0] || "",
        kind: "station",
        reason: "From parent intent goal",
        source: "intent",
        composerLessonId: null,
        composerUnitId: null,
      });
    }
  }

  for (const theme of input.intent.themes) {
    if (
      !bindCatalog(
        theme,
        input.intent.subjects[0] || theme,
        `Composer lesson bound to this child for theme ${theme}`,
      )
    ) {
      add({
        title: input.intent.subjects[0] ? `${theme} through ${input.intent.subjects[0]}` : theme,
        subject: input.intent.subjects[0] || theme,
        kind: "station",
        reason: "From parent intent theme",
        source: "intent",
        composerLessonId: null,
        composerUnitId: null,
      });
    }
  }

  const promptLines = (input.prompt || "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 16);
  for (const line of promptLines) {
    if (!bindCatalog(line, input.intent.subjects[0] || "", `Composer lesson bound to this child from re-prompt`)) {
      add({
        title: line,
        subject: input.intent.subjects[0] || "",
        kind: "station",
        reason: "Parent re-prompt",
        source: "prompt",
        composerLessonId: null,
        composerUnitId: null,
      });
    }
  }

  if (!items.length) {
    const fallback = input.intent.timeHorizon || input.intent.constraints[0] || "Parent path";
    add({
      title: fallback,
      subject: input.intent.subjects[0] || "",
      kind: "station",
      reason: "From parent intent",
      source: "intent",
      composerLessonId: null,
      composerUnitId: null,
    });
  }

  return items;
}
