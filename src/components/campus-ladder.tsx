export function CampusLadder() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-card">
      <div className="relative aspect-[16/10] w-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,color-mix(in_srgb,var(--primary)_22%,transparent),transparent_42%),radial-gradient(circle_at_86%_78%,color-mix(in_srgb,var(--primary)_14%,transparent),transparent_36%)]" />
        <svg viewBox="0 0 640 400" className="absolute inset-0 h-full w-full" aria-hidden>
          <rect x="48" y="44" width="220" height="150" rx="22" fill="var(--secondary)" />
          <rect x="372" y="68" width="220" height="112" rx="22" fill="var(--secondary)" />
          <rect
            x="88"
            y="214"
            width="464"
            height="136"
            rx="28"
            fill="var(--background)"
            stroke="var(--border)"
          />
          <rect x="72" y="60" width="88" height="10" rx="5" fill="var(--primary)" opacity="0.85" />
          <rect x="72" y="84" width="164" height="18" rx="8" fill="var(--foreground)" opacity="0.78" />
          <rect x="72" y="114" width="128" height="10" rx="5" fill="var(--muted-foreground)" opacity="0.45" />
          <rect x="396" y="88" width="64" height="10" rx="5" fill="var(--primary)" opacity="0.7" />
          <rect x="396" y="110" width="148" height="14" rx="7" fill="var(--foreground)" opacity="0.55" />
          <rect
            x="120"
            y="242"
            width="120"
            height="80"
            rx="16"
            fill="var(--card)"
            stroke="var(--border)"
          />
          <rect
            x="260"
            y="242"
            width="120"
            height="80"
            rx="16"
            fill="var(--card)"
            stroke="var(--border)"
          />
          <rect
            x="400"
            y="242"
            width="120"
            height="80"
            rx="16"
            fill="var(--card)"
            stroke="var(--border)"
          />
          <circle cx="180" cy="270" r="8" fill="var(--primary)" />
          <circle cx="320" cy="270" r="8" fill="var(--primary)" />
          <circle cx="460" cy="270" r="8" fill="var(--primary)" />
        </svg>
        <div className="absolute inset-x-0 bottom-0 p-5">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Campus ladder
          </p>
          <p className="mt-1 font-display text-2xl tracking-tight sm:text-3xl">
            Watch. Work. Clear.
          </p>
        </div>
      </div>
    </div>
  );
}
