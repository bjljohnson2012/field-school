import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOAuthProviderStatus } from "@/lib/auth/env";
import { checkoutPath, getPaidPlan } from "@/lib/billing/plans";
import { SignupForm } from "./signup-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Join the free beta",
  description:
    "Join the Field School training portal for free. Google, X, or email and password.",
};

type SignupSearch = {
  plan?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<SignupSearch>;
}) {
  const paid = getPaidPlan(firstValue((await searchParams).plan));
  if (paid) redirect(checkoutPath(paid.id));

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
