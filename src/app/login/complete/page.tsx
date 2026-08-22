"use client";

import { Suspense } from "react";
import { OAuthCompleteClient } from "./oauth-complete-client";

export default function OAuthCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16">
          <p className="text-sm text-muted-foreground">Finishing staff sign-in…</p>
        </main>
      }
    >
      <OAuthCompleteClient />
    </Suspense>
  );
}
