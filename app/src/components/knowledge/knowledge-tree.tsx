"use client";

import { ChevronRight } from "lucide-react";
import type { KnowledgePiece } from "@/lib/library/knowledge-network";
import { cn } from "@/lib/utils";

export function KnowledgeTree({
  pieces,
  focusId,
  empty,
  onFocus,
}: {
  pieces: KnowledgePiece[];
  focusId: string | null;
  empty: string;
  onFocus: (id: string | null) => void;
}) {
  if (!pieces.length) {
    return <p className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-sm text-muted-foreground">{empty}</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="hidden grid-cols-[minmax(0,1fr)_7.5rem_4.5rem] gap-3 border-b border-border px-4 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:grid">
        <span>Knowledge</span>
        <span>Status</span>
        <span className="text-right">Parts</span>
      </div>
      {pieces.map((piece) => {
        const open = piece.id === focusId;
        return (
          <div key={piece.id} className="border-b border-border last:border-b-0">
            <button
              type="button"
              aria-expanded={open}
              onClick={() => onFocus(open ? null : piece.id)}
              className={cn(
                "grid w-full grid-cols-1 gap-2 px-4 py-3 text-left sm:grid-cols-[minmax(0,1fr)_7.5rem_4.5rem] sm:items-center sm:gap-3",
                open && "bg-secondary/70",
              )}
            >
              <span className="flex min-w-0 items-start gap-2">
                <ChevronRight
                  className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-200", open && "rotate-90")}
                  aria-hidden="true"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{piece.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {piece.sourceLabel ? `${piece.sourceLabel} · ` : ""}
                    {piece.generated ? "Generated" : "Not generated yet"}
                  </span>
                </span>
              </span>
              <span
                className={cn(
                  "inline-flex h-6 w-fit items-center rounded-full px-2 text-xs sm:justify-self-start",
                  piece.statusLabel === "Published" ? "bg-pass/15 text-pass" : "bg-secondary text-muted-foreground",
                )}
              >
                {piece.statusLabel}
              </span>
              <span className="text-xs tabular-nums text-muted-foreground sm:text-right sm:text-sm">{piece.units.length}</span>
            </button>
            {open ? (
              <div className="border-t border-border bg-background px-4 py-4 sm:pl-10">
                {piece.excerpt ? <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{piece.excerpt}</p> : null}
                <p className="mt-4 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Subknowledge</p>
                {piece.units.length ? (
                  <ul className="mt-2 divide-y divide-border rounded-xl border border-border">
                    {piece.units.map((unit) => (
                      <li key={unit.id} className="px-4 py-3">
                        <p className="text-sm font-medium">{unit.title}</p>
                        {unit.excerpt && unit.excerpt !== unit.title ? (
                          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{unit.excerpt}</p>
                        ) : null}
                        <p className="mt-1 text-xs text-muted-foreground">{unit.quizCount > 0 ? "Quiz written" : "No quiz yet"}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-muted-foreground">No point is stored on this document yet.</p>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
