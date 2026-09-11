"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { STUDENT_ID } from "@/lib/campus";
import { enterAs } from "@/lib/portal";

export function StartJordanWalk() {
  const router = useRouter();

  useEffect(() => {
    enterAs(STUDENT_ID);
    router.replace("/c/grok-bot");
  }, [router]);

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Campus walk
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">
        Opening Jordan’s desk
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Same student walk staff use on the demo page. This never opens admin.
      </p>
    </main>
  );
}
