"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Membership = { org: string; name: string; stance: string };

const VIEW_ALL = "__all__";

export function OrgPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const [orgs, setOrgs] = useState<Membership[]>([]);
  const [active, setActive] = useState("");

  useEffect(() => {
    void fetch("/api/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) return;
        setOrgs(data.memberships ?? []);
        setActive(pathname === "/people" ? VIEW_ALL : data.activeOrg?.slug || "");
      });
  }, [pathname]);

  if (!orgs.length) return null;

  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      Org
      <select
        className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
        value={active}
        onChange={(e) => {
          const slug = e.target.value;
          setActive(slug);
          if (slug === VIEW_ALL) {
            router.push("/people");
            return;
          }
          void fetch("/api/org/active", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug }),
          }).then(() => router.push(`/o/${slug}`));
        }}
      >
        {orgs.map((org) => (
          <option key={org.org} value={org.org}>
            {org.name || org.org}
          </option>
        ))}
        <option value={VIEW_ALL}>View all</option>
      </select>
    </label>
  );
}
