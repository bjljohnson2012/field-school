"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState, type ReactNode } from "react";
import { CommandPalette } from "@/components/command-palette";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { isLeader, navLinks, NEW_DOORS, SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SynthesisStatusBanner } from "@/components/synthesis-status-banner";
import { ORG_SWITCH_EVENT, parseShellViewer, roomOf, shellCommands, type ShellViewer } from "@/lib/shell/model";
import { learnZone } from "@/lib/shell/routes";

/** Re-read on navigation so an Org switch re-filters the whole chrome without a reload. */
function useShellViewer(signedIn: boolean, pathname: string) {
  const [viewer, setViewer] = useState<ShellViewer | null>(null);
  const [switches, setSwitches] = useState(0);
  useEffect(() => {
    const onSwitch = () => {
      setViewer(null);
      setSwitches((n) => n + 1);
    };
    window.addEventListener(ORG_SWITCH_EVENT, onSwitch);
    return () => window.removeEventListener(ORG_SWITCH_EVENT, onSwitch);
  }, []);
  useEffect(() => {
    if (!signedIn) {
      setViewer(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/me")
      .then((res) => res.json())
      .then((json: unknown) => {
        if (!cancelled) setViewer(parseShellViewer(json));
      })
      .catch(() => {
        if (!cancelled) setViewer(null);
      });
    return () => {
      cancelled = true;
    };
  }, [signedIn, pathname, switches]);
  return viewer;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const signedIn = status === "authenticated";
  const viewer = useShellViewer(signedIn, pathname);
  const leader = Boolean(viewer && isLeader(viewer.stance));
  const bar = navLinks({ loggedIn: signedIn, guest: !signedIn, leader, org: viewer?.org ?? "" });
  const commands = shellCommands({ bar, newDoors: leader ? NEW_DOORS : [], viewer: signedIn ? viewer : null });
  const room = viewer ? roomOf(viewer.org) : null;

  return (
    <div className="flex min-h-full flex-1 flex-col" data-room={room ?? undefined}>
      <SiteHeader viewer={viewer} />
      <ImpersonationBanner />
      <div className="flex-1" data-learn-zone={learnZone(pathname) ?? undefined}>
        {room === "sales" ? (
          <div className="mx-auto max-w-6xl px-4 pt-4">
            <SynthesisStatusBanner />
          </div>
        ) : null}
        {children}
      </div>
      {signedIn ? null : <SiteFooter />}
      <CommandPalette commands={commands} />
    </div>
  );
}
