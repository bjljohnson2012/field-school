import type { ComponentProps, ReactNode } from "react";
import type { Kpi } from "@/lib/desk/kpi";

/**
 * The four desk parts Insights, People, and Library share: page frame, card, KPI strip, table, empty line.
 * Structure only, on FS tokens. The visual system is the Designer's to seal.
 */

const WIDTH = { "3xl": "max-w-3xl", "4xl": "max-w-4xl", "6xl": "max-w-6xl" } as const;

export function DeskPage({
  eyebrow,
  title,
  lede,
  width = "6xl",
  children,
  ...rest
}: {
  eyebrow: string;
  title: string;
  lede?: ReactNode;
  width?: keyof typeof WIDTH;
  children: ReactNode;
} & Omit<ComponentProps<"main">, "title" | "children">) {
  return (
    <main {...rest} data-desk-page="" className={`mx-auto ${WIDTH[width]} px-4 py-12`}>
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{title}</h1>
      {lede ? <div className="mt-3 max-w-2xl text-sm text-muted-foreground">{lede}</div> : null}
      <div className="mt-8">{children}</div>
    </main>
  );
}

export function DeskCard({
  title,
  hint,
  children,
  className = "",
  ...rest
}: {
  title: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
} & Omit<ComponentProps<"section">, "title" | "children" | "className">) {
  return (
    <section aria-label={title} {...rest} data-desk-card="" className={`rounded-xl border border-border bg-card p-5 ${className}`}>
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function KpiStrip({ items, label }: { items: readonly Kpi[]; label: string }) {
  if (!items.length) return null;
  return (
    <dl aria-label={label} data-kpis="" className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {items.map((kpi) => (
        <div key={kpi.id} data-kpi={kpi.id} className="rounded-xl border border-border bg-card px-4 py-3">
          <dt className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{kpi.label}</dt>
          <dd className="mt-1 font-display text-3xl tracking-tight">{kpi.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p data-empty="" className="text-sm text-muted-foreground">
      {children}
    </p>
  );
}

/** Rows come from the caller. With no rows, `empty` spans every column; pass null while rows are still loading. */
export function DeskTable({
  caption,
  columns,
  empty,
  rowCount,
  children,
}: {
  caption: string;
  columns: readonly string[];
  empty: ReactNode;
  rowCount: number;
  children: ReactNode;
}) {
  return (
    <div data-desk-table="" className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-card text-xs uppercase tracking-[0.12em] text-muted-foreground">
          <tr>
            {columns.map((column) => (
              <th key={column} className="px-4 py-3 font-medium">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowCount || empty === null ? (
            children
          ) : (
            <tr>
              <td className="px-4 py-6" colSpan={columns.length}>
                <EmptyState>{empty}</EmptyState>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
