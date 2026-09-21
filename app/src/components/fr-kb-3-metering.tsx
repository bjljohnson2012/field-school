"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import {
  METERING_MODELS,
  METERING_PRICE_SOURCE,
  learnWithBenHirePlans,
} from "@/lib/credits/metering-display";

const LOGIN_NEXT = "/login?next=/metering";
const HIRE = learnWithBenHirePlans();

type CreditsPayload = {
  ok?: boolean;
  error?: string;
  mode?: string;
  account?: { mode?: string; units?: number; status?: string } | null;
};

export function FrKb3Metering() {
  const { data, status } = useSession();
  const signedIn = status === "authenticated" && Boolean(data?.user?.email);
  const [credits, setCredits] = useState<CreditsPayload | null>(null);
  const [hireCount, setHireCount] = useState(0);

  useEffect(() => {
    if (!signedIn) {
      setCredits(null);
      setHireCount(0);
      return;
    }
    fetch("/api/billing/hire")
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as {
          rows?: Array<{ activated?: boolean }>;
        };
        setHireCount(Array.isArray(body.rows) ? body.rows.length : 0);
      })
      .catch(() => {
        setHireCount(0);
      });
    let cancelled = false;
    fetch("/api/credits")
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as CreditsPayload;
        if (!cancelled) setCredits({ ...body, ok: res.ok });
      })
      .catch(() => {
        if (!cancelled) setCredits({ ok: false, error: "credits_unavailable" });
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn]);

  const units = credits?.account?.units;
  const ledgerMode = credits?.account?.mode || credits?.mode || "";

  return (
    <section data-metering="fr-kb-3">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Knowledge-brain use
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Metering</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        Parent sees how Learn with Ben hire stays fair after checkout. Two
        models already in the product thesis. Prices stay on the locked
        market-research amounts.
      </p>
      <p
        className="mt-3 text-sm text-muted-foreground"
        data-price-source="learn-with-ben-market-research"
      >
        {METERING_PRICE_SOURCE}
      </p>

      {signedIn ? (
        <p className="mt-4 text-sm" data-metering-session="signed-in">
          Signed in as {data?.user?.name || data?.user?.email}.{" "}
          {credits?.ok && typeof units === "number" ? (
            <span data-credit-units={String(units)}>
              Platform ledger: {units} units · mode {ledgerMode || "platform"}.
            </span>
          ) : (
            <span
              data-credit-scope="hire"
              data-hire-activated={hireCount > 0 ? "true" : "false"}
            >
              {hireCount > 0
                ? `Webhook hire activations on campus: ${hireCount}. Household family-mode still holds the credit ledger.`
                : "Hire metering is the monthly Learn with Ben seat. Household family-mode holds the credit ledger."}
            </span>
          )}
        </p>
      ) : (
        <p className="mt-4 text-sm" data-metering-session="guest">
          Guest can read the model.{" "}
          <Link href={LOGIN_NEXT} className="underline">
            Sign in
          </Link>{" "}
          to own the hire session.
        </p>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {METERING_MODELS.map((model) => (
          <article
            key={model.id}
            className="rounded-xl border border-border bg-card px-5 py-6"
            data-metering-model={model.id}
          >
            <h2 className="font-display text-2xl tracking-tight">{model.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              {model.body}
            </p>
          </article>
        ))}
      </div>

      <h2 className="mt-10 font-display text-2xl tracking-tight">
        Locked hire amounts
      </h2>
      <ul className="mt-4 flex flex-wrap gap-3">
        {HIRE.map((plan) => (
          <li key={plan.id}>
            <Link
              href={plan.href}
              data-metering-plan={plan.id}
              className="inline-flex h-11 items-center rounded-xl border border-border px-4 text-sm"
            >
              {plan.name} · {plan.priceLabel}
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted-foreground">
        Ready / HLS play stays at{" "}
        <Link href="/play/lesson-spine" className="underline">
          /play/lesson-spine
        </Link>
        . Parent-supervised progress is{" "}
        <Link href="/progress" className="underline">
          /progress
        </Link>
        . Distribute held. Launch closed.
      </p>
    </section>
  );
}
