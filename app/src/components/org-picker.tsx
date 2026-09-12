"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Membership = { org: string; name: string; stance: string };

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
        setActive(data.activeOrg?.slug || "");
      });
  }, [pathname]);

  if (orgs.length < 2) return null;

  return (
    <label className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
      Org
      <select
        className="h-9 rounded-lg border border-border bg-background px-2 text-sm text-foreground"
        value={active}
        onChange={(e) => {
          const slug = e.target.value;
          setActive(slug);
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
      </select>
    </label>
  );
}
