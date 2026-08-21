import { COMPANY_NAME } from "@/lib/course/types";

/** Structured campus preview — replaces staged product photos in share/hero. */
export function CampusHeroArt() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative aspect-[16/10] w-full">
        <div
          className="absolute inset-0 opacity-90"
          style={{
            background:
              "radial-gradient(circle at 18% 22%, color-mix(in srgb, var(--color-accent) 18%, transparent), transparent 44%), radial-gradient(circle at 84% 78%, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 38%), linear-gradient(160deg, var(--color-surface), var(--color-bg))",
          }}
        />
        <svg
          viewBox="0 0 640 400"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <rect
            x="48"
            y="52"
            width="240"
            height="168"
            rx="16"
            fill="var(--color-raised)"
            stroke="var(--color-border)"
          />
          <rect
            x="352"
            y="72"
            width="240"
            height="128"
            rx="16"
            fill="var(--color-raised)"
            stroke="var(--color-border)"
          />
          <rect
            x="88"
            y="248"
            width="464"
            height="104"
            rx="16"
            fill="var(--color-bg)"
            stroke="var(--color-border)"
          />
          <rect
            x="72"
            y="72"
            width="72"
            height="8"
            rx="4"
            fill="var(--color-accent)"
            opacity="0.85"
          />
          <rect
            x="72"
            y="96"
            width="172"
            height="16"
            rx="6"
            fill="var(--color-fg)"
            opacity="0.72"
          />
          <rect
            x="72"
            y="128"
            width="140"
            height="8"
            rx="4"
            fill="var(--color-muted)"
            opacity="0.5"
          />
          <rect
            x="72"
            y="152"
            width="108"
            height="8"
            rx="4"
            fill="var(--color-muted)"
            opacity="0.35"
          />
          <rect
            x="376"
            y="96"
            width="56"
            height="8"
            rx="4"
            fill="var(--color-accent)"
            opacity="0.7"
          />
          <rect
            x="376"
            y="120"
            width="160"
            height="12"
            rx="5"
            fill="var(--color-fg)"
            opacity="0.55"
          />
          <rect
            x="376"
            y="148"
            width="120"
            height="8"
            rx="4"
            fill="var(--color-muted)"
            opacity="0.4"
          />
          <rect
            x="120"
            y="272"
            width="112"
            height="56"
            rx="10"
            fill="var(--color-surface)"
            stroke="var(--color-border)"
          />
          <rect
            x="264"
            y="272"
            width="112"
            height="56"
            rx="10"
            fill="var(--color-surface)"
            stroke="var(--color-border)"
          />
          <rect
            x="408"
            y="272"
            width="112"
            height="56"
            rx="10"
            fill="var(--color-surface)"
            stroke="var(--color-border)"
          />
          <circle cx="176" cy="292" r="6" fill="var(--color-accent)" />
          <circle cx="320" cy="292" r="6" fill="var(--color-accent)" />
          <circle cx="464" cy="292" r="6" fill="var(--color-accent)" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            {COMPANY_NAME}
          </p>
          <p className="mt-1 font-display text-2xl tracking-tight sm:text-3xl">
            Watch. Work. Clear.
          </p>
        </div>
      </div>
    </div>
  );
}
