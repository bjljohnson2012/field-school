import type { Metadata } from "next";
import { Suspense } from "react";
import { CartClient } from "./cart-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review a Field School training portal seat, then pay on Stripe.",
};

export default function CartPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-lg px-6 py-8">
          <p className="text-sm text-muted-foreground">Opening your cart…</p>
        </main>
      }
    >
      <CartClient />
    </Suspense>
  );
}
