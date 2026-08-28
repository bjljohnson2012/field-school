"use client";

import { signIn } from "next-auth/react";
import type { OAuthProviderStatus } from "@/lib/auth/env";

type Props = {
  oauth: OAuthProviderStatus;
  nextPath?: string;
  tone?: "member" | "staff";
};

export function OAuthSignInButtons({
  oauth,
  nextPath = "/dashboard",
  tone = "member",
}: Props) {
  const callbackUrl = `/login/complete?next=${encodeURIComponent(nextPath)}`;

  if (!oauth.configured) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
        {tone === "staff"
          ? "Staff Google and X sign-in are not configured on this campus yet. Set "
          : "Google and X are not configured on this campus yet. You can still join with email and password. Set "}
        <code className="text-xs">AUTH_SECRET</code> and provider credentials
        (see <code className="text-xs">AUTH.md</code>
        ). Staff access stays on the allowlist.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {oauth.google ? (
        <button
          type="button"
          className="h-12 rounded-xl border border-border px-5 text-sm font-medium"
          onClick={() => signIn("google", { callbackUrl })}
        >
          Continue with Google
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">
          Google sign-in unavailable — missing{" "}
          <code>GOOGLE_CLIENT_ID</code> / <code>GOOGLE_CLIENT_SECRET</code>.
        </p>
      )}
      {oauth.twitter ? (
        <button
          type="button"
          className="h-12 rounded-xl border border-border px-5 text-sm font-medium"
          onClick={() => signIn("twitter", { callbackUrl })}
        >
          Continue with X
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">
          X sign-in unavailable — missing X/Twitter client credentials.
        </p>
      )}
    </div>
  );
}
