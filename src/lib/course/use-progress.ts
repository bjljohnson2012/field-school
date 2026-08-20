import { useCallback, useEffect, useMemo, useState } from "react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import {
  loadProgress,
  saveAssignment,
  saveExam,
  saveQuiz,
  saveWatched,
} from "./progress";
import { allStationsPassed, computePassed, emptyProgress } from "./content";
import type { CourseRecord, ModuleProgress, ProgressMap } from "./types";

function storageKey(slug: string) {
  return `jfsu-progress:${slug}`;
}

function readLocal(slug: string): ProgressMap {
  if (typeof window === "undefined" || !slug) return {};
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

function writeLocal(slug: string, map: ProgressMap) {
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

export type ExamState = {
  score: number;
  passed: boolean;
  at?: string;
} | null;

export function useCourseProgress(course: CourseRecord | null | undefined) {
  const { user, isPending } = useCurrentUserState();
  const slug = course?.slug ?? "";
  const [map, setMap] = useState<ProgressMap>({});
  const [exam, setExam] = useState<ExamState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setMap(readLocal(slug));
    setReady(true);
  }, [slug]);

  useEffect(() => {
    if (!slug || isPending || !user) return;
    let cancelled = false;
    loadProgress({ data: { courseSlug: slug } })
      .then((res) => {
        if (cancelled) return;
        setMap((local) => {
          const merged: ProgressMap = { ...local, ...res.progress };
          writeLocal(slug, merged);
          return merged;
        });
        setExam(res.exam);
      })
      .catch(() => {
        /* guest / network */
      });
    return () => {
      cancelled = true;
    };
  }, [user, isPending, slug]);

  const patch = useCallback(
    (moduleSlug: string, next: ModuleProgress) => {
      if (!slug) return;
      setMap((prev) => {
        const merged = { ...prev, [moduleSlug]: next };
        writeLocal(slug, merged);
        return merged;
      });
    },
    [slug],
  );

  const markWatched = useCallback(
    async (moduleSlug: string) => {
      if (!course) return;
      const cur = map[moduleSlug] ?? emptyProgress();
      const next = { ...cur, watched: true };
      const mod = course.modules.find((m) => m.slug === moduleSlug);
      if (mod) next.passed = computePassed(mod, next);
      patch(moduleSlug, next);
      if (user) {
        try {
          const saved = await saveWatched({
            data: { courseSlug: course.slug, slug: moduleSlug },
          });
          patch(moduleSlug, saved);
        } catch {
          /* keep local */
        }
      }
    },
    [course, map, patch, user],
  );

  const persistAssignment = useCallback(
    async (
      moduleSlug: string,
      assignment: Record<string, boolean>,
      notes: string,
    ) => {
      if (!course) return;
      const cur = map[moduleSlug] ?? emptyProgress();
      const next = { ...cur, assignment, notes };
      const mod = course.modules.find((m) => m.slug === moduleSlug);
      if (mod) next.passed = computePassed(mod, next);
      patch(moduleSlug, next);
      if (user) {
        try {
          const saved = await saveAssignment({
            data: { courseSlug: course.slug, slug: moduleSlug, assignment, notes },
          });
          patch(moduleSlug, saved);
        } catch {
          /* keep local */
        }
      }
    },
    [course, map, patch, user],
  );

  const persistQuiz = useCallback(
    async (moduleSlug: string, answers: Record<string, number>) => {
      if (!course) return emptyProgress();
      const mod = course.modules.find((m) => m.slug === moduleSlug);
      if (!mod) return emptyProgress();
      let correct = 0;
      for (const q of mod.quiz) {
        if (answers[q.id] === q.answer) correct += 1;
      }
      const need = Math.ceil(mod.quiz.length * course.passRatio);
      const cur = map[moduleSlug] ?? emptyProgress();
      const next = {
        ...cur,
        quizScore: correct,
        quizPassed: correct >= need,
      };
      next.passed = computePassed(mod, next);
      patch(moduleSlug, next);
      if (user) {
        try {
          const saved = await saveQuiz({
            data: { courseSlug: course.slug, slug: moduleSlug, answers },
          });
          patch(moduleSlug, saved);
          return saved;
        } catch {
          /* keep local */
        }
      }
      return next;
    },
    [course, map, patch, user],
  );

  const persistExam = useCallback(
    async (answers: Record<string, number>) => {
      if (!course) {
        return { score: 0, total: 0, passed: false, need: 0 };
      }
      if (user) {
        const res = await saveExam({
          data: { courseSlug: course.slug, answers },
        });
        setExam({
          score: res.score,
          passed: res.passed,
          at: new Date().toISOString(),
        });
        return res;
      }
      let correct = 0;
      for (const q of course.examQuestions) {
        if (answers[q.id] === q.answer) correct += 1;
      }
      const total = course.examQuestions.length;
      const need = Math.ceil(total * course.examPassRatio);
      const res = {
        score: correct,
        total,
        passed: correct >= need,
        need,
      };
      setExam({
        score: res.score,
        passed: res.passed,
        at: new Date().toISOString(),
      });
      return res;
    },
    [course, user],
  );

  const passedCount = useMemo(
    () => (course ? course.modules.filter((m) => map[m.slug]?.passed).length : 0),
    [course, map],
  );

  const certified =
    Boolean(course) &&
    allStationsPassed(map, course?.modules) &&
    Boolean(exam?.passed);

  return {
    map,
    exam,
    ready: ready && !isPending,
    signedIn: Boolean(user),
    markWatched,
    persistAssignment,
    persistQuiz,
    persistExam,
    passedCount,
    total: course?.modules.length ?? 0,
    certified,
  };
}
