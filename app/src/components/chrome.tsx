import type { ReactNode } from "react";
import { auth } from "@/auth";
import { AppShell, GuestChrome } from "@/components/app-shell";
import { loadSession } from "@/lib/campus-runtime/identity";
import { memberPlatformAdmin } from "@/lib/coaching/scores";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function coachingShellEnabled() {
  const value = process.env.COACHING_SHELL?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "on" || value === "yes";
}

export async function Chrome({ children }: { children: ReactNode }) {
  if (!coachingShellEnabled()) {
    return (
      <>
        <SiteHeader />
        <ImpersonationBanner />
        <div className="flex-1">{children}</div>
        <SiteFooter />
      </>
    );
  }

  const session = await auth().catch(() => null);
  const email = session?.user?.email?.trim();
  if (email) {
    const name = session?.user?.name?.trim() || email.split("@")[0] || "Account";
    let platformAdmin = false;
    try {
      const loaded = await loadSession();
      if (loaded?.member?.id) platformAdmin = await memberPlatformAdmin(loaded.member.id);
    } catch {
      platformAdmin = false;
    }
    return (
      <div data-chrome="coach" className="flex min-h-full flex-1 flex-col">
        <AppShell name={name} platformAdmin={platformAdmin}>
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
