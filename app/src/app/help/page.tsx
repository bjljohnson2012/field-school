import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadTaskActor } from "@/app/api/coaching/tasks/session";
import { HelpClient } from "@/components/help-client";
import { memberHasPlatformAdmin } from "@/lib/coaching/access";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Help" };

function capabilitiesFor(
  world: { capabilities: readonly { membershipId: string; capability: string }[] },
  actor: { membershipId: string; stance: string },
) {
  const names = new Set<string>();
  if (actor.stance && actor.stance !== "platform_admin") names.add(actor.stance);
  for (const row of world.capabilities) {
    if (row.membershipId !== actor.membershipId) continue;
    if (!row.capability || row.capability === "platform_admin") continue;
    names.add(row.capability);
  }
  return [...names];
}

export default async function HelpPage() {
  const loaded = await loadTaskActor();
  if (!loaded.ok) {
    if (loaded.status === 401) redirect("/login?next=/help");
    return (
      <main>
        <h1 className="h-page">Help</h1>
        <section className="card mt-6 p-6">
          <p>A signed-in coaching identity is required.</p>
        </section>
      </main>
    );
  }

  return (
    <main>
      <HelpClient
        capabilities={capabilitiesFor(loaded.world, loaded.actor)}
        platformAdmin={memberHasPlatformAdmin(loaded.world, loaded.actor.memberId)}
      />
    </main>
  );
}
