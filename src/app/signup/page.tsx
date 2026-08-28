import type { Metadata } from "next";
import { Suspense } from "react";
import { getOAuthProviderStatus } from "@/lib/auth/env";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Join the free beta",
  description:
    "Join Field School University for free. Google, X, or email and password. No card.",
};

export default function SignupPage() {
  const oauth = getOAuthProviderStatus();
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16">
          <p className="text-sm text-muted-foreground">Loading join…</p>
        </main>
      }
    >
      <SignupForm oauth={oauth} />
    </Suspense>
  );
}
