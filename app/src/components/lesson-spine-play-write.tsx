"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { brainBoard, type LivingBrain } from "@/lib/living-brain/model";
import { lessonSpineContinue, lessonSpineRail, lessonSpineResume, lessonSpineStage } from "@/lib/player/lesson-spine-step";
import { assignCompleteBody, playWriteBody, portionWriteBody, proveCompleteBody, railPreferenceBody, resumeWriteBody, teachCompleteBody } from "@/lib/player/play-rail-write";

export type LessonSpineContinueAt = NonNullable<ReturnType<typeof lessonSpineContinue>> & {
  login: "none" | "member";
  room: "household" | "sales";
  offsetSec: number;
  cue: string;
  stage: "assign" | "teach" | "prove" | null;
};

/** Signed-in continue point. Guests stay at the start and do not write. */
export function useLessonSpineContinue() {
  const { data, status } = useSession();
  const email = data?.user?.email;
  const [continueAt, setContinueAt] = useState<LessonSpineContinueAt | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !email) {
      setContinueAt(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/living-brain")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { ok?: boolean; room?: string; brain?: LivingBrain | null } | null) => {
        if (cancelled) return;
        const room = payload?.room === "household" || payload?.room === "sales" ? payload.room : null;
        if (!payload?.ok || !room) {
          setContinueAt(null);
          return;
        }
        const person = brainBoard({ room, brain: payload.brain ?? null }).people.find((row) =>
          lessonSpineContinue(row.outcomes),
        );
        const next = person ? lessonSpineContinue(person.outcomes) : null;
        const resume = person ? lessonSpineResume(person.outcomes) : null;
        if (!person || !next) {
          setContinueAt(null);
          return;
        }
        setContinueAt({
          ...next,
          login: person.login,
          room,
          offsetSec: resume?.offsetSec ?? 0,
          cue: resume?.cue ?? "",
          stage: lessonSpineStage(person.outcomes),
        });
      })
      .catch(() => {
        if (!cancelled) setContinueAt(null);
      });
    return () => {
      cancelled = true;
    };
  }, [email, status]);

  return continueAt;
}

/** Last play rail stored for the person on this desk. Guests stay unset and do not write. */
export function useLessonSpineRail() {
  const { data, status } = useSession();
  const email = data?.user?.email;
  const [rail, setRail] = useState<"remotion" | "html5" | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !email) {
      setRail(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/living-brain")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { ok?: boolean; room?: string; brain?: LivingBrain | null } | null) => {
        if (cancelled) return;
        const room = payload?.room === "household" || payload?.room === "sales" ? payload.room : null;
        if (!payload?.ok || !room) {
          setRail(null);
          return;
        }
        const person = brainBoard({ room, brain: payload.brain ?? null }).people[0];
        setRail(person ? lessonSpineRail(person.outcomes) : null);
      })
      .catch(() => {
        if (!cancelled) setRail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [email, status]);

  return rail;
}

const STORAGE_KEY = "fs-lesson-spine-play-write";

export function useLessonSpinePlayWrite() {
  const { data, status } = useSession();
  const email = data?.user?.email;
  const [wrote, setWrote] = useState(false);

  const recordPlay = useCallback(
    async (chapterId: string) => {
      if (status !== "authenticated" || !email) return;
      if (sessionStorage.getItem(STORAGE_KEY)) {
        setWrote(true);
        return;
      }
      const got = await fetch("/api/living-brain");
      if (!got.ok) return;
      const payload = (await got.json()) as {
        ok?: boolean;
        room?: "household" | "sales";
        brain?: Parameters<typeof playWriteBody>[0]["brain"];
      };
      if (!payload.ok || (payload.room !== "household" && payload.room !== "sales")) return;
      const body = playWriteBody({
        room: payload.room,
        brain: payload.brain ?? null,
        chapterId,
      });
      if (!body) return;
      const posted = await fetch("/api/living-brain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!posted.ok) return;
      sessionStorage.setItem(STORAGE_KEY, body.outcomes);
      setWrote(true);
    },
    [email, status],
  );

  const recordResume = useCallback(
    async (offsetSec: number, cue: string) => {
      if (status !== "authenticated" || !email) return;
      const got = await fetch("/api/living-brain");
      if (!got.ok) return;
      const payload = (await got.json()) as {
        ok?: boolean;
        room?: "household" | "sales";
        brain?: Parameters<typeof resumeWriteBody>[0]["brain"];
      };
      if (!payload.ok || (payload.room !== "household" && payload.room !== "sales")) return;
      const body = resumeWriteBody({
        room: payload.room,
        brain: payload.brain ?? null,
        offsetSec,
        cue,
      });
      if (!body) return;
      await fetch("/api/living-brain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    [email, status],
  );

  const recordPortion = useCallback(
    async (chapterId: string) => {
      if (status !== "authenticated" || !email) return;
      const key = "fs-lesson-spine-portion";
      const done = (sessionStorage.getItem(key) || "").split(",").filter(Boolean);
      if (done.includes(chapterId)) return;
      const got = await fetch("/api/living-brain");
      if (!got.ok) return;
      const payload = (await got.json()) as {
        ok?: boolean;
        room?: "household" | "sales";
        brain?: Parameters<typeof portionWriteBody>[0]["brain"];
      };
      if (!payload.ok || (payload.room !== "household" && payload.room !== "sales")) return;
      const body = portionWriteBody({
        room: payload.room,
        brain: payload.brain ?? null,
        chapterId,
      });
      if (!body) return;
      const posted = await fetch("/api/living-brain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!posted.ok) return;
      sessionStorage.setItem(key, [...done, chapterId].join(","));
      setWrote(true);
    },
    [email, status],
  );

  const recordProve = useCallback(
    async (chapterId: string) => {
      if (status !== "authenticated" || !email) return;
      const key = "fs-lesson-spine-prove";
      const done = (sessionStorage.getItem(key) || "").split(",").filter(Boolean);
      if (done.includes(chapterId)) return;
      const got = await fetch("/api/living-brain");
      if (!got.ok) return;
      const payload = (await got.json()) as {
        ok?: boolean;
        room?: "household" | "sales";
        brain?: Parameters<typeof proveCompleteBody>[0]["brain"];
      };
      if (!payload.ok || (payload.room !== "household" && payload.room !== "sales")) return;
      const body = proveCompleteBody({
        room: payload.room,
        brain: payload.brain ?? null,
        chapterId,
      });
      if (!body) return;
      const posted = await fetch("/api/living-brain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!posted.ok) return;
      sessionStorage.setItem(key, [...done, chapterId].join(","));
      setWrote(true);
    },
    [email, status],
  );

  const recordRail = useCallback(
    async (rail: "remotion" | "html5") => {
      if (status !== "authenticated" || !email) return;
      const got = await fetch("/api/living-brain");
      if (!got.ok) return;
      const payload = (await got.json()) as {
        ok?: boolean;
        room?: "household" | "sales";
        brain?: Parameters<typeof railPreferenceBody>[0]["brain"];
      };
      if (!payload.ok || (payload.room !== "household" && payload.room !== "sales")) return;
      const body = railPreferenceBody({
        room: payload.room,
        brain: payload.brain ?? null,
        rail,
      });
      if (!body) return;
      await fetch("/api/living-brain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    },
    [email, status],
  );

  const recordAssignComplete = useCallback(async () => {
    if (status !== "authenticated" || !email) return;
    const got = await fetch("/api/living-brain");
    if (!got.ok) return;
    const payload = (await got.json()) as {
      ok?: boolean;
      room?: "household" | "sales";
      brain?: Parameters<typeof assignCompleteBody>[0]["brain"];
    };
    if (!payload.ok || (payload.room !== "household" && payload.room !== "sales")) return;
    const body = assignCompleteBody({ room: payload.room, brain: payload.brain ?? null });
    if (!body) return;
    await fetch("/api/living-brain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }, [email, status]);

  const recordTeachComplete = useCallback(async () => {
    if (status !== "authenticated" || !email) return;
    const got = await fetch("/api/living-brain");
    if (!got.ok) return;
    const payload = (await got.json()) as {
      ok?: boolean;
      room?: "household" | "sales";
      brain?: Parameters<typeof teachCompleteBody>[0]["brain"];
    };
    if (!payload.ok || (payload.room !== "household" && payload.room !== "sales")) return;
    const body = teachCompleteBody({ room: payload.room, brain: payload.brain ?? null });
    if (!body) return;
    await fetch("/api/living-brain", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  }, [email, status]);

  return { recordPlay, recordResume, recordPortion, recordProve, recordRail, recordAssignComplete, recordTeachComplete, wrote };
}
