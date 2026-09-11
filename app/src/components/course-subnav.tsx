"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCoursePortal } from "@/hooks/use-portal";
import { cn } from "@/lib/utils";

export function CourseSubnav({ courseSlug }: { courseSlug: string }) {
  const pathname = usePathname();
  const { tally } = useCoursePortal(courseSlug);
  const items = [
    { href: `/c/${courseSlug}`, label: "Ladder", exact: true },
    { href: `/c/${courseSlug}/desk`, label: "Desk" },
    { href: `/c/${courseSlug}/exam`, label: "Exam" },
    ...(tally.certified
      ? [{ href: `/c/${courseSlug}/certificate`, label: "Certificate" }]
      : []),
  ];

  return (
    <div className="border-b border-border bg-card/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4">
        <nav className="flex gap-1 text-sm">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex h-11 items-center px-3 text-muted-foreground hover:text-foreground",
                  active && "text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <span className="hidden h-8 items-center rounded-md border border-border px-2 font-mono text-xs tabular-nums text-muted-foreground md:inline-flex">
          {tally.passed}/{tally.total}
        </span>
      </div>
    </div>
  );
}
