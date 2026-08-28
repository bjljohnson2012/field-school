import { Suspense } from "react";
import { getOAuthProviderStatus } from "@/lib/auth/env";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const oauth = getOAuthProviderStatus();
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16">
          <p className="text-sm text-muted-foreground">Loading sign in…</p>
        </main>
      }
    >
      <LoginForm oauth={oauth} />
    </Suspense>
  );
}
