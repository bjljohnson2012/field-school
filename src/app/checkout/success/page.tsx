import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutSuccessClient } from "./success-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "You're in",
  description: "Payment received. Your Field School seat is open on this email.",
};

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-md px-4 py-16">
          <p className="text-sm text-muted-foreground">Opening your seat…</p>
        </main>
      }
    >
      <CheckoutSuccessClient />
    </Suspense>
  );
}
