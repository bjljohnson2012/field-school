import type { Metadata } from "next";
import { Suspense } from "react";
import { ClaimForm } from "./claim-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set your password",
  description: "Open the Field School login for the email you paid with.",
};

export default function ClaimPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </main>
      }
    >
      <ClaimForm />
    </Suspense>
  );
}
