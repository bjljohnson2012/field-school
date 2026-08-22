"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  activateMemberFromAuth,
  activateStaffFromOAuth,
} from "@/lib/auth/portal-bridge";
import { isAdminRoute } from "@/lib/admin-gate";
import { isStaffSession } from "@/lib/members/policy";

export function OAuthCompleteClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    const next = searchParams.get("next") || "/dashboard";

    if (status !== "authenticated" || !session?.user) {
      router.replace("/signup?error=Callback");
      return;
    }

    if (isStaffSession(session) && session.user.email) {
      const ok = activateStaffFromOAuth(
        session.user.email,
        session.user.name ?? undefined,
      );
      if (!ok) {
        setError("Staff seat could not be attached. Try Google or X again.");
        return;
      }
      const safeNext = isAdminRoute(next) ? next : "/admin";
      router.replace(safeNext);
      return;
    }

    activateMemberFromAuth(session.user.email, session.user.name);
    if (isAdminRoute(next)) {
      router.replace("/request-access?from=admin");
      return;
    }
    router.replace(next.startsWith("/") ? next : "/dashboard");
  }, [status, session, router, searchParams]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <p className="text-sm text-destructive">{error}</p>
        <Link href="/signup" className="mt-4 inline-block text-sm underline">
          Back to join
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-sm text-muted-foreground">Finishing sign-in…</p>
    </main>
  );
}
