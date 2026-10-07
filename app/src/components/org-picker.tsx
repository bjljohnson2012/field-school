"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ORG_SWITCH_EVENT, type ShellMembership } from "@/lib/shell/model";

const VIEW_ALL = "__all__";

export function OrgPicker({
  memberships,
  active,
  quiet = false,
}: {
  memberships: readonly ShellMembership[];
  active: string;
  quiet?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => setPicked(null), [active]);
  const value = pathname === "/people" ? VIEW_ALL : (picked ?? active);

  if (!memberships.length) return null;

  const shown = memberships.find((org) => org.org === (picked ?? active));
  const here = value === VIEW_ALL ? "Everybody" : shown?.name || shown?.org || "This org";

  return (
    <div className="px-0.5">
      <p className="text-sm font-medium text-foreground">{here}</p>
      <label className="mt-2 flex flex-col gap-1 text-xs uppercase tracking-[0.14em] text-muted-foreground">
        <span className={quiet ? "sr-only" : undefined}>Switch org</span>
        <select
          className="h-10 w-full rounded-xl border border-border bg-background px-2 text-sm normal-case tracking-normal text-foreground"
          value={value}
          onChange={(e) => {
            const slug = e.target.value;
            if (slug === VIEW_ALL) {
              router.push("/people");
              return;
            }
            setPicked(slug);
            void fetch("/api/org/active", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ slug }),
            }).then(() => {
              window.dispatchEvent(new Event(ORG_SWITCH_EVENT));
              router.push(`/o/${slug}`);
            });
          }}
        >
          {memberships.map((org) => (
            <option key={org.org} value={org.org}>
              {org.name || org.org}
            </option>
          ))}
          <option value={VIEW_ALL}>View Everybody</option>
        </select>
      </label>
    </div>
  );
}
