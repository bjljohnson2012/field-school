"use client";

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
    return <p className="px-4 py-10 text-sm leading-relaxed text-muted-foreground">{empty}</p>;
  }

  return (
    <nav aria-label="Pages" className="flex min-h-full flex-col">
      <div className="flex h-11 items-center border-b border-border px-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">Pages</p>
      </div>
      <ul className="py-2">
        {pieces.map((piece) => {
          const open = piece.id === focusId;
          return (
            <li key={piece.id}>
              <button
                type="button"
                aria-current={open ? "page" : undefined}
                onClick={() => onFocus(piece.id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm",
                  open ? "bg-secondary font-medium text-foreground" : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
                )}
              >
                <PageMark open={open} />
                <span className="min-w-0 flex-1 truncate">{piece.title}</span>
                <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">{piece.units.length}</span>
              </button>
              {open ? (
                <ul className="mb-1 ml-5 border-l border-border">
                  <li className="px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Subknowledge
                  </li>
                  {piece.units.length ? (
                    piece.units.map((unit) => (
                      <li key={unit.id}>
                        <a
                          href={`#unit-${unit.id}`}
                          className="block truncate py-1 pl-3 pr-3 text-xs text-muted-foreground hover:text-foreground"
                        >
                          {unit.title}
                        </a>
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-1 text-xs text-muted-foreground">No point is stored on this document yet.</li>
                  )}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function PageMark({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      className={cn("size-3.5 shrink-0", open ? "text-primary" : "text-muted-foreground")}
    >
      <path
        d="M4 1.5h5.2L13 5.2V14a.5.5 0 0 1-.5.5h-8A.5.5 0 0 1 4 14V1.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M9 1.8V5h3.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}
