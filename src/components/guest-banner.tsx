import { Link, useRouterState } from "@tanstack/react-router";
import { UserRound } from "lucide-react";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export function GuestBanner() {
  const { user, isPending } = useCurrentUserState();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (isPending || user) return null;

  return (
    <div className="border-b border-border bg-surface/70">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-start gap-2 text-sm text-muted">
          <UserRound className="mt-0.5 size-4 shrink-0 text-accent" />
          <span>
            You’re here as a guest. Progress is saved in this browser while you
            stay. Exit the page and it is gone. Sign in with Google, X, or email
            to keep a dashboard.
          </span>
        </p>
        <Link
          to="/login"
          search={{ next: pathname }}
          className="md-interactive inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg"
        >
          Save with an account
        </Link>
      </div>
    </div>
  );
}
