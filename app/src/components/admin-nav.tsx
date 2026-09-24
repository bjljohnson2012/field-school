"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePortal } from "@/hooks/use-portal";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/demo", label: "Student demo" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/notifications", label: "Inbox" },
  { href: "/admin/access-requests", label: "Access requests" },
  { href: "/admin/forms", label: "Forms" },
  { href: "/admin/tools", label: "Add tools" },
  { href: "/admin/catalog", label: "Catalog" },
];

export function AdminNav() {
  const pathname = usePathname();
  const { unreadNotices } = usePortal();

  return (
    <div className="border-b border-border bg-background/88">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="eyebrow">Admin</p>
        <nav className="flex flex-wrap gap-1 text-sm">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const showBadge = item.href === "/admin/notifications" && unreadNotices > 0;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex h-10 items-center gap-2 border-b-2 border-transparent px-3 text-muted-foreground hover:text-foreground",
                  active && "border-primary text-foreground",
                )}
              >
                {item.label}
                {showBadge ? (
                  <span className="grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-foreground">
                    {unreadNotices}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
