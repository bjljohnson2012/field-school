import { PlanBuilder } from "@/components/individual/plan-builder";
import { planPublicPayload } from "@/lib/individual/surface";

export const dynamic = "force-dynamic";

export default function IndividualPlanPage() {
  const view = planPublicPayload({});
  return (
    <main data-shell="m9" data-rail="learn-library-you" data-rail-px="240" data-viewport-fixture="375">
      <PlanBuilder
        title={view.title}
        items={view.items}
        changes={view.changes}
        ariaLive={view.ariaLive}
        cta={view.cta}
        available={view.available}
      />
    </main>
  );
}
