"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Check, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export function DropWell({
  label,
  hint,
  accept,
  multiple,
  name,
  retain,
  inputRef,
  onFiles,
  children,
  className,
}: {
  label: string;
  hint?: string;
  accept?: string;
  multiple?: boolean;
  name?: string;
  retain?: boolean;
  inputRef?: RefObject<HTMLInputElement | null>;
  onFiles?: (files: FileList) => void;
  children?: ReactNode;
  className?: string;
}) {
  const localRef = useRef<HTMLInputElement>(null);
  const field = inputRef ?? localRef;
  const [over, setOver] = useState(false);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!landed) return;
    const timer = window.setTimeout(() => setLanded(false), 700);
    return () => window.clearTimeout(timer);
  }, [landed]);

  function take(files: FileList | null) {
    if (!files?.length) return;
    if (retain && field.current) {
      const transfer = new DataTransfer();
      for (const file of Array.from(files)) transfer.items.add(file);
      field.current.files = transfer.files;
    }
    onFiles?.(files);
    setLanded(true);
  }

  return (
    <div
      data-drop={over ? "over" : landed ? "landed" : "idle"}
      className={cn(
        "rounded-2xl border border-dashed px-4 py-5 transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out",
        className,
        over && "-translate-y-1 scale-[1.02] border-primary bg-primary/10 shadow-[0_22px_44px_-18px_rgba(31,60,136,0.55)]",
        !over && landed && "drop-land border-pass bg-pass/10",
        !over && !landed && "border-border bg-background hover:border-foreground/30",
      )}
      onClick={(event) => {
        const target = event.target as HTMLElement;
        if (target.closest("button, a, input, textarea, label")) return;
        field.current?.click();
      }}
      onDragEnter={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setOver(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        take(event.dataTransfer.files);
      }}
    >
      <input
        ref={field}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        className="sr-only"
        onChange={(event) => {
          take(event.target.files);
          if (!retain) event.target.value = "";
        }}
      />
      <button
        type="button"
        className="flex w-full items-start gap-3 text-left transition-transform duration-150 active:scale-[0.985]"
        onClick={() => field.current?.click()}
      >
        <span
          className={cn(
            "grid size-10 shrink-0 place-items-center rounded-full border transition-transform duration-200",
            over && "scale-110 -translate-y-0.5 border-primary bg-primary/15 text-primary",
            !over && landed && "border-pass bg-pass/15 text-pass",
            !over && !landed && "border-border bg-secondary text-muted-foreground",
          )}
          aria-hidden="true"
        >
          {landed && !over ? <Check className="size-4" /> : <Upload className="size-4" />}
        </span>
        <span className="min-w-0 pt-0.5">
          <p className="text-sm font-medium">{over ? "Drop to add" : landed ? "Added" : label}</p>
          {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
        </span>
      </button>
      {children}
    </div>
  );
}
