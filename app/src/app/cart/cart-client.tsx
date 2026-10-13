"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { coachingMailto, isRetiredCartPlan } from "@/lib/billing/offer-names";

export function CartClient() {
  const requested = useSearchParams().get("plan");
  const blocked = isRetiredCartPlan(requested);

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Cart
      </p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Your seat</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        {blocked
          ? "That seat is not offered. See pricing, or email Ben."
          : "The cart is empty. See pricing, or email Ben."}
      </p>
      <div className="mt-8 flex flex-col gap-3">
        <Link
          href="/pricing"
          className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
        >
          See pricing
        </Link>
        <a
          href={coachingMailto}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-border px-5 text-sm"
        >
          Email Ben
        </a>
      </div>
    </main>
  );
}
