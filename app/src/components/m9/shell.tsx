"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { signOutPortal } from "@/lib/auth/sign-out";
import { LeaveReturnNext } from "@/components/leave-return-next";
import { MotionSpan } from "@/components/m9/motion";
import { OrgPicker } from "@/components/org-picker";
import { OPEN_PALETTE_EVENT, type ShellViewer } from "@/lib/shell/model";
import {
  brainTypeOf,
  HERO_C,
  isM9Leader,
  LEADER_DOORS,
  memberDoors,
  newMenu,
  resolveMemberRail,
  YOU_DOORS,
  type M9Door,
} from "@/lib/shell/m9-shell";

function openPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

function DoorList({ doors, current }: { doors: readonly M9Door[]; current: string }) {
  return (
    <>
      {doors.map((door) => (
        <Link
          key={door.id}
          href={door.href}
          data-rail={door.id}
          aria-current={current === door.href ? "page" : undefined}
          className="m9-rail-link"
        >
          {door.label}
        </Link>
      ))}
    </>
  );
}

export function M9Shell({
  viewer,
  signedIn,
  pathname,
  children,
}: {
  viewer: ShellViewer | null;
  signedIn: boolean;
  pathname: string;
  children: ReactNode;
}) {
  const [drawer, setDrawer] = useState(false);
  const [creating, setCreating] = useState(false);
  const leader = Boolean(signedIn && viewer && isM9Leader(viewer.stance));
  const variant = resolveMemberRail(process.env.NEXT_PUBLIC_MEMBER_RAIL_VARIANT);
  const brain = brainTypeOf(viewer?.org ?? "");
  const creatingItems = brain ? newMenu(brain) : newMenu("family").filter((item) => item.brains.includes("team"));
  const railDoors = leader ? LEADER_DOORS : memberDoors(variant);
  const mobileDoors = leader
    ? [...LEADER_DOORS, { id: "new", label: "New", href: "#new" }]
    : memberDoors(variant);

  if (!signedIn) {
    return (
      <>
        <header data-m9-bar="guest" className="m9-top">
          <Link href="/" className="m9-brand">
            <img src="/branding/assets/isolated-seal.png" alt="" width={28} height={28} />
            <span className="m9-wordmark">Field School</span>
          </Link>
          <nav className="m9-guest-actions" aria-label="Guest">
            <Link href="/login">Sign in</Link>
            <Link href={HERO_C.primaryHref}>{HERO_C.primary}</Link>
          </nav>
        </header>
        {children}
      </>
    );
  }

  return (
    <div data-m9-shell="signed-in" data-member-rail={leader ? "leader" : variant}>
      <header data-m9-bar="signed-in" className="m9-top">
        <button type="button" className="m9-drawer-button" aria-expanded={drawer} onClick={() => setDrawer((open) => !open)}>
          Menu
        </button>
        <Link href="/dashboard" className="m9-brand">
          <img src="/branding/assets/isolated-seal.png" alt="" width={28} height={28} />
          <span className="m9-wordmark">Field School</span>
        </Link>
        <div className="m9-top-actions">
          <LeaveReturnNext />
          <button type="button" className="m9-ghost" onClick={openPalette}>
            Search
          </button>
          <Link href="/help" className="m9-ghost">
            Help
          </Link>
          <Link href="/settings" className="m9-avatar" aria-label="Settings">
            {(viewer?.name || "You").slice(0, 1).toUpperCase()}
          </Link>
          <button type="button" className="m9-ghost" onClick={() => signOutPortal()}>
            Sign out
          </button>
        </div>
      </header>
      <div className="m9-frame">
        <aside className="m9-rail" aria-label="Field School">
          <Link href="/dashboard" className="m9-brain" data-brain-home="true">
            {viewer?.orgName || "This brain"}
          </Link>
          {viewer && viewer.memberships.length > 0 ? (
            <OrgPicker memberships={viewer.memberships} active={viewer.org} quiet />
          ) : null}
          <nav className="m9-rail-nav" data-role={leader ? "leader" : "member"}>
            <DoorList doors={railDoors} current={pathname} />
            {leader ? (
              <div className="m9-new">
                <button type="button" className="m9-rail-link m9-new-row" data-rail="new" onClick={() => setCreating((open) => !open)}>
                  New
                </button>
                {creating ? (
                  <MotionSpan className="m9-new-menu">
                    {creatingItems.map((item) => (
                      <Link key={item.id} href={item.href} data-new={item.id} onClick={() => setCreating(false)}>
                        {item.label}
                      </Link>
                    ))}
                  </MotionSpan>
                ) : null}
              </div>
            ) : null}
          </nav>
          <nav className="m9-you" aria-label="You">
            <p className="m9-you-label">You</p>
            <DoorList doors={YOU_DOORS} current={pathname} />
          </nav>
        </aside>
        <div className="m9-canvas" data-m9-canvas="true">
          {children}
        </div>
      </div>
      {drawer ? (
        <div className="m9-drawer" data-m9-drawer="open">
          <Link href="/dashboard" onClick={() => setDrawer(false)}>
            {viewer?.orgName || "This brain"}
          </Link>
          <DoorList doors={YOU_DOORS} current={pathname} />
          <button type="button" onClick={() => setDrawer(false)}>
            Close
          </button>
        </div>
      ) : null}
      <nav className="m9-mobile-bar" aria-label="Mobile" data-mobile-role={leader ? "leader" : "member"}>
        {mobileDoors.map((door) =>
          door.id === "new" ? (
            <button key={door.id} type="button" className="m9-mobile-link" onClick={() => setCreating((open) => !open)}>
              New
            </button>
          ) : (
            <Link key={door.id} href={door.href} className="m9-mobile-link">
              {door.label}
            </Link>
          ),
        )}
      </nav>
    </div>
  );
}
