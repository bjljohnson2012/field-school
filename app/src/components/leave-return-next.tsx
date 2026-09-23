"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { brainBoard, type LivingBrain, type Room } from "@/lib/living-brain/model";
import { lessonSpineStep } from "@/lib/player/play-rail-write";

type ReturnStep = { title: string; login: "none" | "member"; room: Room };

export function LeaveReturnNext() {
  const { data, status } = useSession();
  const email = data?.user?.email;
  const [step, setStep] = useState<ReturnStep | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !email) {
      setStep(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/living-brain")
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { ok?: boolean; room?: string; brain?: LivingBrain } | null) => {
        if (cancelled) return;
        const room = payload?.room === "household" || payload?.room === "sales" ? payload.room : null;
        if (!payload?.ok || !room) {
          setStep(null);
          return;
        }
        const person = brainBoard({ room, brain: payload.brain ?? null }).people.find((row) =>
          lessonSpineStep(row.outcomes),
        );
        const title = person ? lessonSpineStep(person.outcomes) : null;
        if (!person || !title) {
          setStep(null);
          return;
        }
        setStep({ title, login: person.login, room });
      })
      .catch(() => {
        if (!cancelled) setStep(null);
      });
    return () => {
      cancelled = true;
    };
  }, [email, status]);

  if (!step) return null;
  return (
    <p
      className="hidden min-w-0 truncate text-xs text-muted-foreground sm:block"
      data-leave-return="living-brain"
      data-lesson-spine-next={step.title}
      data-next-from="outcomes"
      data-login={step.login}
      data-sales-children={step.room === "sales" ? "0" : undefined}
    >
      <Link href="/play/lesson-spine" className="underline underline-offset-2">
        {step.title}
      </Link>
      {step.login === "none" ? " The child has no login." : " This desk lists no children."}
    </p>
  );
}
