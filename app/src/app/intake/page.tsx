import type { Metadata } from "next";
import { IntakeWizard } from "./intake-wizard";

export const metadata: Metadata = { title: "Intake" };

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const params = await searchParams;
  const kind = params.kind === "director_intake" ? "director_intake" : "intake";
  return (
    <main>
      <h1 className="h-page">Intake</h1>
      <p className="mt-3 text-sm text-muted-foreground">One question at a time. You can save and come back.</p>
      <IntakeWizard kind={kind} />
    </main>
  );
}
