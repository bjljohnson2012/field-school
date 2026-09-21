"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";

const PLAY_NEXT = "/login?next=/play/lesson-spine";

export function LessonSpineParentSession() {
  const { data, status } = useSession();
  const signedIn = status === "authenticated" && Boolean(data?.user?.email);
  const label = data?.user?.name?.trim() || data?.user?.email || "Parent";

  if (signedIn) {
    return (
      <p
        className="mt-3 text-sm text-muted-foreground"
        data-parent-session="signed-in"
      >
        Signed in as {label}. Ready / HLS play is yours — guest play still
        works without an account.
      </p>
    );
  }

  return (
    <p
      className="mt-3 text-sm text-muted-foreground"
      data-parent-session="guest"
    >
      Guest play is open.{" "}
      <Link href={PLAY_NEXT} className="underline">
        Sign in
      </Link>{" "}
      to own this LessonSpine session as a Parent.
    </p>
  );
}
