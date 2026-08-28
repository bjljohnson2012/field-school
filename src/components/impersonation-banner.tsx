"use client";

import { useRouter } from "next/navigation";
import { stopImpersonating } from "@/lib/portal";
import { usePortal } from "@/hooks/use-portal";

export function ImpersonationBanner() {
  const { impersonating, impersonator, user } = usePortal();
  const router = useRouter();
  if (!impersonating || !user || !impersonator) return null;

  return (
    <div className="border-b border-warn/40 bg-warn/10">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-2 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          Viewing campus as <span className="font-medium">{user.name}</span>
          {user.email ? ` · ${user.email}` : ""}. Staff seat stays{" "}
          {impersonator.name}.
        </p>
        <button
          type="button"
          className="h-9 self-start rounded-xl border border-border bg-card px-3 text-sm"
          onClick={() => {
            stopImpersonating();
            router.push("/admin/users");
          }}
        >
          Stop impersonating
        </button>
      </div>
    </div>
  );
}
