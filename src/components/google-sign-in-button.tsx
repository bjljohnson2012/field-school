"use client";

import { DEAN_EMAIL } from "@/lib/campus";
import { signInWithGoogleAccount } from "@/lib/portal";

export function GoogleSignInButton({
  next = "/admin",
  label = "Continue with Google",
}: {
  next?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => {
        signInWithGoogleAccount({
          email: DEAN_EMAIL,
          name: "Benjamin Johnson",
        });
        window.location.assign(next);
      }}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium hover:bg-secondary/60"
    >
      <GoogleMark />
      {label}
    </button>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.4c-.3 1.4-1.1 2.6-2.4 3.4v2.8h3.9c2.3-2.1 3.6-5.2 3.6-8.3Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-2.8c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3c2 4 6.1 6.4 10.6 6.4Z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.6c-.2-.7-.4-1.4-.4-2.2s.1-1.5.4-2.2V7.2H1.4C.5 9 0 10.9 0 12.4c0 1.5.5 3.4 1.4 5.2l4-3Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.1 15.2 0 12 0 7.5 0 3.4 2.4 1.4 6.4l4 3c.9-2.8 3.5-4.6 6.6-4.6Z"
      />
    </svg>
  );
}
