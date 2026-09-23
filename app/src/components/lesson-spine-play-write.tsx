"use client";

import { useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { playWriteBody } from "@/lib/player/play-rail-write";

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

  return { recordPlay, wrote };
}
