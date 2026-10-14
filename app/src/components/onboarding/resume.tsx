"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Sends a signed-in member back to the persisted step until campus_ready. Learn stays open. */
export function OnboardingResume({ pathname }: { pathname: string }) {
  const router = useRouter();
  useEffect(() => {
    if (pathname.startsWith("/onboarding")) return;
    let cancelled = false;
    void fetch(`/api/onboarding?path=${encodeURIComponent(pathname)}`)
      .then((res) => res.json())
      .then((json: { resume?: boolean }) => {
        if (!cancelled && json.resume) router.replace("/onboarding");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pathname, router]);
  return null;
}
