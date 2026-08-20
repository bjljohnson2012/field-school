import { Link } from "@tanstack/react-router";

export function GuestContinueDialog({
  open,
  nextPath,
  showSignIn = true,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  nextPath?: string;
  showSignIn?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-fg/30 px-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-continue-title"
    >
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-xl">
        <p className="text-xs uppercase tracking-[0.16em] text-muted">Guest access</p>
        <h2 id="guest-continue-title" className="mt-2 font-display text-2xl tracking-tight">
          Progress stays here — until you leave
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Continuing as a guest saves stations, desk notes, and exam attempts in
          this browser so you can keep moving. If you exit the page, close the
          tab, clear site data, or open campus on another device, that progress
          is gone.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Sign in with Google, X, or email to keep a dashboard the dean can also
          see.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
          <button
            type="button"
            onClick={onConfirm}
            className="md-interactive inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg"
          >
            Continue as guest
          </button>
          {showSignIn ? (
            <Link
              to="/login"
              search={{ next: nextPath }}
              className="md-interactive inline-flex h-11 items-center justify-center rounded-xl border border-border px-4 text-sm"
              onClick={onCancel}
            >
              Sign in instead
            </Link>
          ) : null}
          <button
            type="button"
            onClick={onCancel}
            className="md-interactive inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm text-muted"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
