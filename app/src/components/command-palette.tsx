"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type PaletteItem = { href: string; label: string };

export function paletteItems(input: {
  room: "sales" | "household" | "operator";
  nav: readonly PaletteItem[];
  doors: readonly PaletteItem[];
  coaching: readonly PaletteItem[];
}): PaletteItem[] {
  const rows: PaletteItem[] = [...input.nav, ...input.doors];
  if (input.room === "sales") rows.push(...input.coaching);
  const seen = new Set<string>();
  const out: PaletteItem[] = [];
  for (const row of rows) {
    if (seen.has(row.href)) continue;
    seen.add(row.href);
    out.push({ href: row.href, label: row.label });
  }
  return out;
}

export function CommandPalette({ items }: { items: readonly PaletteItem[] }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const key = event.key.toLowerCase();
      if ((event.metaKey || event.ctrlKey) && key === "k") {
        event.preventDefault();
        setOpen((current) => !current);
        setQuery("");
        return;
      }
      if (key === "escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!open) return null;

  const needle = query.trim().toLowerCase();
  const shown = needle
    ? items.filter((item) => `${item.label} ${item.href}`.toLowerCase().includes(needle))
    : items;

  return (
    <div
      className="fixed inset-0 z-50 bg-foreground/40"
      data-command-palette=""
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-label="Jump to a page"
        aria-keyshortcuts="Control+K Meta+K"
        className="mx-auto mt-24 w-full max-w-lg rounded-card border border-border bg-card p-2 shadow-card"
        onClick={(event) => event.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Jump to a page"
          className="input"
          aria-label="Filter pages"
        />
        <ul className="mt-2 max-h-80 overflow-auto">
          {shown.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="block rounded-brand px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
