import { Suspense } from "react";
import { coachingShellEnabled } from "@/components/chrome";
import { getOAuthProviderStatus } from "@/lib/auth/env";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const oauth = getOAuthProviderStatus();
  const coachingShell = coachingShellEnabled();
  return (
    <Suspense
      fallback={
        coachingShell ? (
          <div className="card w-full max-w-md p-8">
            <p className="text-sm text-muted-foreground">Loading sign in…</p>
          </div>
        ) : (
          <main className="mx-auto max-w-md px-6 py-8">
            <p className="text-sm text-muted-foreground">Loading sign in…</p>
          </main>
        )
      }
    >
      <LoginForm oauth={oauth} coachingShell={coachingShell} />
    </Suspense>
  );
}
