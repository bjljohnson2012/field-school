import { Suspense } from "react";
import { getOAuthProviderStatus } from "@/lib/auth/env";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  const oauth = getOAuthProviderStatus();
  return (
    <Suspense
      fallback={
        <div className="card w-full max-w-md p-8">
          <p className="text-sm text-muted-foreground">Loading sign in…</p>
        </div>
      }
    >
      <LoginForm oauth={oauth} />
    </Suspense>
  );
}
