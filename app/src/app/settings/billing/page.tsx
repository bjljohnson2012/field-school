import type { Metadata } from "next";
import Link from "next/link";
import { CHECKOUT_GO_LIVE } from "@/lib/billing/checkout-destination";
import { coachingAction } from "@/lib/billing/m8-prep";

export const metadata: Metadata = {
  title: "Billing",
  description: "Your Coaching tier, credits, and how to email Ben.",
};

export default function BillingSettingsPage() {
  const action = coachingAction({
    tier: "model",
    mode: CHECKOUT_GO_LIVE ? "test" : "off",
  });
  const href = action.kind === "email" ? action.href : "/pricing";
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl tracking-tight">Billing</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Offers are Do It Yourself, Coaching, and Consulting. Credits for this brain live on this page.
        Coaching stays on Email Ben while checkout is off.
      </p>
      <p className="mt-6">
        <Link className="underline" href="/settings/ai">
          AI settings
        </Link>
      </p>
      <a
        href={href}
        className="mt-6 inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
      >
        Email Ben
      </a>
    </main>
  );
}
