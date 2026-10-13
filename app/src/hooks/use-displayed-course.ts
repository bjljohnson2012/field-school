"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  fetchProgress,
  importServerProgress,
  postProgress,
  type ServerProgress,
} from "@/lib/campus-runtime/client";
import { getCourse } from "@/lib/course/catalog";
import type { ModuleProgress, ProgressMap } from "@/lib/course/types";
import type { ExamSnapshot } from "@/lib/progress/rules";
import { useCoursePortal } from "@/hooks/use-portal";
import { importableCourseSnapshot } from "@/lib/portal";
import { progressWriteTarget } from "@/lib/progress/rules";

const memory = new Map<string, ServerProgress>();
const inflight = new Map<string, Promise<ServerProgress>>();
const imported = new Set<string>();
const listeners = new Set<() => void>();

function publish(courseSlug: string, data: ServerProgress) {
  memory.set(courseSlug, data);
  for (const listener of listeners) listener();
}

async function loadServerCourse(courseSlug: string) {
  const pending = inflight.get(courseSlug);
  if (pending) return pending;
  const job = (async () => {
    if (!imported.has(courseSlug)) {
      imported.add(courseSlug);
      const snapshot = importableCourseSnapshot(courseSlug);
      if (snapshot) {
        const importedProgress = await importServerProgress(courseSlug, snapshot);
        if (importedProgress?.authenticated) {
          publish(courseSlug, importedProgress);
          return importedProgress;
        }
      }
    }
    const data = await fetchProgress(courseSlug);
    publish(courseSlug, data);
    return data;
  })().finally(() => {
    inflight.delete(courseSlug);
  });
  inflight.set(courseSlug, job);
  return job;
}

export function useDisplayedCourse(courseSlug: string) {
  const { data: session, status } = useSession();
  const signedIn = status === "authenticated" && Boolean(session?.user?.email);
  const local = useCoursePortal(courseSlug);
  const [server, setServer] = useState<ServerProgress | null>(memory.get(courseSlug) ?? null);
  const [serverReady, setServerReady] = useState(Boolean(memory.get(courseSlug)));

  useEffect(() => {
    if (status === "loading") return;
    if (!signedIn) {
      setServerReady(true);
      return;
    }
    let cancel = false;
    const onProgress = () => {
      const next = memory.get(courseSlug);
      if (next) setServer(next);
    };
    listeners.add(onProgress);
    void loadServerCourse(courseSlug).then((next) => {
      if (cancel) return;
      setServer(next);
      setServerReady(true);
    });
    return () => {
      cancel = true;
      listeners.delete(onProgress);
    };
  }, [courseSlug, signedIn, status]);

  const catalog = getCourse(courseSlug);
  const localCourse = local.course;
  const useServer = status === "loading" || signedIn;
  const modules: ProgressMap = useServer ? (server?.modules ?? {}) : (localCourse?.modules ?? {});
  const exam: ExamSnapshot | null = useServer ? (server?.exam ?? null) : (localCourse?.exam ?? null);
  const certified = Boolean(signedIn && server?.authenticated && server.certified);
  const passed = catalog
    ? catalog.modules.filter((mod) => modules[mod.slug]?.passed).length
    : 0;

  async function submit(input: {
    station: string;
    kind: "watch" | "practice" | "check" | "exam";
    answers?: Record<string, number>;
    assignment?: Record<string, boolean>;
    notes?: string;
  }) {
    const result = await postProgress({ course: courseSlug, ...input });
    if (result.progress) publish(courseSlug, result.progress);
    return result;
  }

  return {
    ready: status !== "loading" && (signedIn ? serverReady : local.ready),
    signedIn,
    writeTarget: progressWriteTarget(status === "loading" || signedIn),
    modules,
    exam,
    certified,
    passed,
    total: catalog?.modules.length ?? 0,
    session: local.session,
    submit,
  };
}

export type DisplayedModule = ModuleProgress;
