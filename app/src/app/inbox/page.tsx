"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePortal } from "@/hooks/use-portal";

export default function InboxPage() {
  const router = useRouter();
  const { ready, isStaff, impersonating } = usePortal();

  useEffect(() => {
    if (!ready) return;
    router.replace(isStaff && !impersonating ? "/admin/notifications" : "/dashboard");
  }, [ready, isStaff, impersonating, router]);

  return null;
}
