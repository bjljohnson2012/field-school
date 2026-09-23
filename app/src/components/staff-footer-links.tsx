"use client";

import Link from "next/link";
import { usePortal } from "@/hooks/use-portal";

export function StaffFooterLinks() {
  const { ready, isStaff } = usePortal();
  if (!ready || !isStaff) return null;
  return (
    <>
      <Link href="/admin" className="text-[#7a746a] hover:text-foreground">
        Admin
      </Link>
    </>
  );
}
