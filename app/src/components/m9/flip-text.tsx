import { flipStaggerMs, M9_METRICS } from "@/lib/shell/m9-shell";

/** Wizard finish heading only. CSS keyframes, once, no motion library. */
export function FlipText({ text }: { text: string }) {
  const chars = Array.from(text);
  return (
    <h2 className="m9-flip font-display text-3xl tracking-tight" data-flip-text="wizard-finish" aria-label={text}>
      {chars.map((char, index) => (
        <span
          key={`${char}-${index}`}
          className="m9-flip-char"
          aria-hidden="true"
          style={{ animationDelay: `${flipStaggerMs(index, chars.length)}ms`, animationDuration: `${M9_METRICS.flipTextMaxMs}ms` }}
        >
          {char === " " ? "\u00a0" : char}
        </span>
      ))}
    </h2>
  );
}
