"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminNav } from "@/components/admin-nav";
import { usePortal } from "@/hooks/use-portal";
import { loginRedirectForAdmin } from "@/lib/admin-gate";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { ready, isStaff } = usePortal();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!ready) return;
    if (!isStaff) router.replace(loginRedirectForAdmin(pathname || "/admin"));
  }, [ready, isStaff, router, pathname]);

  if (!ready || !isStaff) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <p className="text-sm text-muted-foreground">Checking staff access…</p>
      </main>
    );
  }

  return (
    <>
      <AdminNav />
      {children}
    </>
  );
}
