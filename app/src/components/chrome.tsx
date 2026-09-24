import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell, GuestChrome } from "@/components/app-shell";
import { readOrgLogoUrl } from "@/components/org-logo";
import { loadSession } from "@/lib/campus-runtime/identity";
import { memberPlatformAdmin } from "@/lib/coaching/scores";

export async function Chrome({ children }: { children: ReactNode }) {
  const session = await auth().catch(() => null);
  const email = session?.user?.email?.trim();
  if (email) {
    const name = session?.user?.name?.trim() || email.split("@")[0] || "Account";
    let platformAdmin = false;
    let logoUrl = "";
    try {
      const loaded = await loadSession();
      if (loaded?.member?.id) platformAdmin = await memberPlatformAdmin(loaded.member.id);
      logoUrl = readOrgLogoUrl(loaded?.active?.features);
    } catch {
      platformAdmin = false;
      logoUrl = "";
    }
    return (
      <div data-chrome="coach" className="flex min-h-full flex-1 flex-col">
        <AppShell name={name} platformAdmin={platformAdmin} logoUrl={logoUrl}>
          {children}
        </AppShell>
      </div>
    );
  }

  return (
    <div data-chrome="coach" className="flex min-h-full flex-1 flex-col">
      <GuestChrome>{children}</GuestChrome>
    </div>
  );
}
