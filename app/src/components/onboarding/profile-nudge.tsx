"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PROFILE_COPY } from "@/lib/profile/model";

/** Name menu nudge once campus is ready and the adult gates are still open. */
export function OnboardingProfileNudge() {
  const [href, setHref] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void fetch("/api/onboarding")
      .then((res) => res.json())
      .then((json: { nudge?: { href: string } | null }) => {
        if (!cancelled) setHref(json.nudge?.href ?? null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);
  if (!href) return null;
  return (
    <Link
      href={href}
      data-profile-nudge="gates"
      className="flex h-11 items-center rounded-lg px-2 text-sm text-foreground hover:bg-secondary"
    >
      {PROFILE_COPY.incomplete}
    </Link>
  );
}
