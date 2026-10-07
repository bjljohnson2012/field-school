"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { filterCommands, OPEN_PALETTE_EVENT, type ShellItem } from "@/lib/shell/model";

const LISTBOX = "command-palette-list";
const optionId = (id: string) => `command-${id.replace(/[^a-zA-Z0-9_-]/g, "-")}`;

export function CommandPalette({ commands }: { commands: readonly ShellItem[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const results = filterCommands(commands, query);

  useEffect(() => {
    if (!commands.length) return;
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, [commands.length]);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setQuery("");
    setCursor(0);
    input.current?.focus();
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("keydown", onEscape);
      if (before?.isConnected) before.focus();
    };
  }, [open]);

  if (!open) return null;

  const go = (item: ShellItem | undefined) => {
    if (!item) return;
    setOpen(false);
    router.push(item.href);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-foreground/20 px-4 pt-24"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) setOpen(false);
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to"
        data-command-palette="open"
        className="w-full max-w-lg rounded-xl border border-border bg-background shadow-md"
      >
        <input
          ref={input}
          value={query}
          placeholder="Jump to…"
          aria-label="Jump to"
          role="combobox"
          aria-expanded="true"
          aria-controls={LISTBOX}
          aria-autocomplete="list"
          aria-activedescendant={results[cursor] ? optionId(results[cursor].id) : undefined}
          className="h-12 w-full rounded-t-xl border-b border-border bg-transparent px-4 text-sm outline-none"
          onChange={(event) => {
            setQuery(event.target.value);
            setCursor(0);
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setCursor((value) => Math.max(Math.min(value + 1, results.length - 1), 0));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setCursor((value) => Math.max(value - 1, 0));
            }
            if (event.key === "Enter") go(results[cursor]);
          }}
        />
        <ul id={LISTBOX} className="max-h-80 overflow-y-auto p-1" role="listbox" aria-label="Commands">
          {results.map((item, i) => (
            <li
              key={item.id}
              id={optionId(item.id)}
              role="option"
              aria-selected={i === cursor}
              data-command={item.href}
              className={`flex h-11 w-full cursor-pointer items-center justify-between rounded-lg px-3 text-left text-sm ${
                i === cursor ? "bg-secondary text-foreground" : "text-muted-foreground"
              }`}
              onMouseEnter={() => setCursor(i)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => go(item)}
            >
              <span>
                {item.label}
                {item.hint ? <span className="ml-2 text-xs">{item.hint}</span> : null}
              </span>
              <span className="text-xs uppercase tracking-[0.16em]">{item.group}</span>
            </li>
          ))}
        </ul>
        {results.length ? null : <p className="px-4 py-3 text-sm text-muted-foreground">Nothing matches.</p>}
      </div>
    </div>
  );
}
