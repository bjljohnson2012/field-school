import Link from "next/link";
import {
  LEARN_WITH_BEN_PLAN_IDS,
  PAID_PLANS,
  checkoutPath,
} from "@/lib/billing/plans";

export function LessonSpineHirePath() {
  return (
    <section className="mt-6" data-hire-path="learn-with-ben">
      <h2 className="h-section">Hire Learn with Ben</h2>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Signed-in Parent checkout uses the unlocked amounts only — $100, $200,
        and $1,000. Ready / HLS play stays open for guests. No new prices.{" "}
        <Link href="/metering" className="underline">
          See use / metering
        </Link>
        {" · "}
        <Link href="/progress" className="underline">
          Parent progress
        </Link>
        .
      </p>
      <ul className="mt-4 flex flex-wrap gap-3">
        {LEARN_WITH_BEN_PLAN_IDS.map((id) => {
          const plan = PAID_PLANS[id];
          return (
            <li key={id}>
              <Link
                href={checkoutPath(id)}
                data-hire-plan={id}
                className="inline-flex items-center rounded-brand border border-border bg-card px-4 py-2.5 text-sm font-semibold transition-all duration-200 ease-brand hover:bg-muted"
              >
                Enroll {plan.priceLabel}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
