"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { activateStaffFromOAuth } from "@/lib/auth/portal-bridge";
import { isAdminRoute } from "@/lib/admin-gate";

export function OAuthCompleteClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    const next = searchParams.get("next") || "/admin";
    const safeNext = isAdminRoute(next) ? next : "/admin";

    if (status !== "authenticated" || !session?.user?.email) {
      setError("Staff sign-in did not complete. Try again from the login page.");
      return;
    }

    const ok = activateStaffFromOAuth(
      session.user.email,
      session.user.name ?? undefined,
    );
    if (!ok) {
      setError(
        "That account is not on the staff allowlist for this campus.",
      );
      return;
    }

    router.replace(safeNext);
  }, [status, session, router, searchParams]);

  if (error) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <p className="text-sm text-destructive">{error}</p>
        <a href="/login" className="mt-4 inline-block text-sm underline">
          Back to sign in
        </a>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <p className="text-sm text-muted-foreground">Finishing staff sign-in…</p>
    </main>
  );
}
