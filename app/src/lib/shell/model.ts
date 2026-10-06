import { coachingNav } from "../coaching/nav.ts";
import type { Room } from "../living-brain/model.ts";
import { PROFILE_COPY } from "../profile/model.ts";

export type ShellMembership = { org: string; name: string; stance: string };

/** What the shell knows about the signed-in viewer. One read of /api/me feeds the bar, Org, avatar, and Cmd-K. */
export type ShellViewer = {
  name: string;
  memberKind: "adult" | "child";
  org: string;
  orgName: string;
  stance: string;
  platformAdmin: boolean;
  logoUrl: string;
  memberships: readonly ShellMembership[];
  profiles: readonly { membershipId: string; displayName: string }[];
};

/** Cmd-K lives in the shell host; the bar and the avatar menu only ask it to open. */
export const OPEN_PALETTE_EVENT = "fs:open-palette";

export type ShellGroup = "Go" | "New" | "Account" | "Profiles" | "Sales desk";
export type ShellItem = { id: string; label: string; href: string; group: ShellGroup; badge?: "tasks"; hint?: string };
type Door = { href: string; label: string; hint?: string };

function field(raw: object, key: string): unknown {
  return Object.getOwnPropertyDescriptor(raw, key)?.value;
}

function str(raw: object, key: string): string {
  const value = field(raw, key);
  return typeof value === "string" ? value : "";
}

function objects(raw: unknown): object[] {
  if (!Array.isArray(raw)) return [];
  const list: unknown[] = raw;
  return list.filter((item): item is object => typeof item === "object" && item !== null);
}

/** Null for a guest or a malformed reply. */
export function parseShellViewer(json: unknown): ShellViewer | null {
  if (typeof json !== "object" || json === null || field(json, "authenticated") !== true) return null;
  const member = field(json, "member");
  const active = field(json, "activeOrg");
  const activeOrg = typeof active === "object" && active !== null ? active : null;
  const memberObj = typeof member === "object" && member !== null ? member : null;
  return {
    name: memberObj ? str(memberObj, "name") : "",
    memberKind: memberObj && str(memberObj, "kind") === "child" ? "child" : "adult",
    org: activeOrg ? str(activeOrg, "slug") : "",
    orgName: activeOrg ? str(activeOrg, "name") : "",
    stance: activeOrg ? str(activeOrg, "stance") : "",
    platformAdmin: field(json, "platformAdmin") === true,
    logoUrl: str(json, "logoUrl"),
    memberships: objects(field(json, "memberships"))
      .map((row) => ({ org: str(row, "org"), name: str(row, "name"), stance: str(row, "stance") }))
      .filter((row) => row.org),
    profiles: objects(field(json, "profiles"))
      .map((row) => ({ membershipId: str(row, "membershipId"), displayName: str(row, "displayName") }))
      .filter((row) => row.membershipId),
  };
}

export function roomOf(org: string): Room | null {
  return org === "household" || org === "sales" ? org : null;
}

/**
 * Avatar-menu items after View Profile. Household: the tracked children this adult edits.
 * Sales: the card, tasks, and account the coaching desk needs. Never both, and never by default.
 */
export function accountItems(viewer: ShellViewer): ShellItem[] {
  const room = roomOf(viewer.org);
  const account: ShellItem = { id: "account", label: "Account", href: "/account", group: "Account" };
  if (room === "household" && viewer.memberKind === "adult") {
    return [
      ...viewer.profiles.map((kid): ShellItem => ({
        id: `profile:${kid.membershipId}`,
        label: `${kid.displayName} · child profile`,
        href: `/profile/kids/${kid.membershipId}`,
        group: "Profiles",
      })),
      account,
    ];
  }
  if (room === "sales") {
    return [
      { id: "card", label: "My card", href: "/card", group: "Account" },
      { id: "tasks", label: "Tasks", href: "/tasks", group: "Account", badge: "tasks" },
      account,
    ];
  }
  return [account];
}

/** Everything Cmd-K can open, derived from the bar, the New doors, and the avatar menu so no list is kept twice. */
export function shellCommands(input: {
  bar: readonly Door[];
  newDoors: readonly Door[];
  viewer: ShellViewer | null;
}): ShellItem[] {
  const viewer = input.viewer;
  if (!viewer) return [];
  const items: ShellItem[] = [
    ...input.bar.map((door): ShellItem => ({ id: `go:${door.href}`, label: door.label, href: door.href, group: "Go" })),
    ...input.newDoors.map((door): ShellItem => ({
      id: `new:${door.href}`,
      label: door.label,
      href: door.href,
      group: "New",
      ...(door.hint ? { hint: door.hint } : {}),
    })),
    { id: "profile", label: PROFILE_COPY.entry, href: "/profile", group: "Account" },
    ...accountItems(viewer),
    { id: "tools", label: "Tools", href: "/tools", group: "Go" },
    { id: "credits", label: "Credits", href: "/metering", group: "Account" },
  ];
  if (roomOf(viewer.org) === "sales") {
    for (const nav of coachingNav({ orgKind: "sales", capabilities: [viewer.stance], platformAdmin: viewer.platformAdmin })) {
      if (!nav.disabled) items.push({ id: `sales:${nav.href}`, label: nav.label, href: nav.href, group: "Sales desk" });
    }
  }
  const seen = new Set<string>();
  return items.filter((item) => (seen.has(item.href) ? false : (seen.add(item.href), true)));
}

/** Every word of the query must appear in the label, the hint, or the group. */
export function filterCommands(items: readonly ShellItem[], query: string): ShellItem[] {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((item) => {
    const hay = `${item.label} ${item.hint ?? ""} ${item.group}`.toLowerCase();
    return words.every((word) => hay.includes(word));
  });
}
