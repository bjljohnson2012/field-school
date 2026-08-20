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
import {
  readLocalExam,
  readLocalProgress,
  writeLocalExam,
  writeLocalProgress,
} from "./local-store";
import type { CourseRecord, ExamState, ModuleProgress, ProgressMap } from "./types";

export type { ExamState };

export function useCourseProgress(course: CourseRecord | null | undefined) {
  const { user, isPending } = useCurrentUserState();
  const slug = course?.slug ?? "";
  const [map, setMap] = useState<ProgressMap>({});
  const [exam, setExam] = useState<ExamState>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setMap(readLocalProgress(slug));
    setExam(readLocalExam(slug));
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
          writeLocalProgress(slug, merged);
          return merged;
        });
        if (res.exam) {
          setExam(res.exam);
          writeLocalExam(slug, res.exam);
        }
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
        writeLocalProgress(slug, merged);
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
      const finish = (res: {
        score: number;
        total: number;
        passed: boolean;
        need: number;
      }) => {
        const next: ExamState = {
          score: res.score,
          passed: res.passed,
          at: new Date().toISOString(),
        };
        setExam(next);
        writeLocalExam(course.slug, next);
        return res;
      };
      if (user) {
        const res = await saveExam({
          data: { courseSlug: course.slug, answers },
        });
        return finish(res);
      }
      let correct = 0;
      for (const q of course.examQuestions) {
        if (answers[q.id] === q.answer) correct += 1;
      }
      const total = course.examQuestions.length;
      const need = Math.ceil(total * course.examPassRatio);
      return finish({
        score: correct,
        total,
        passed: correct >= need,
        need,
      });
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
