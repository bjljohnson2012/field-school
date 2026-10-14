import { Suspense } from "react";
import { OnboardingFlow } from "./flow";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <main
      className="mx-auto max-w-xl px-4 py-8"
      data-onboarding="m12"
      data-shell="m9"
      data-rail="learn-library-you"
      data-rail-px="240"
      data-viewport-fixture="390"
    >
      <Suspense fallback={<p className="text-sm text-[#5C5850]">Loading the next step.</p>}>
        <OnboardingFlow />
      </Suspense>
    </main>
  );
}
