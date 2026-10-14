import { KidProfileForm } from "./form";

export const dynamic = "force-dynamic";

export default function KidProfilePage() {
  return (
    <main className="mx-auto max-w-xl px-4 py-8" data-onboarding="kid-profile" data-viewport-fixture="390">
      <KidProfileForm />
    </main>
  );
}
