"use client";

type Item = { position: number; label: string; kind: string };

export function PlanBuilder(props: {
  title: string;
  items: Item[];
  changes: string[];
  ariaLive: string;
  cta: string;
  available: boolean;
}) {
  return (
    <section data-plan-builder={props.available ? "on" : "off"} data-viewport="375" className="mx-auto max-w-xl px-4 py-8">
      <h1 className="font-display text-4xl tracking-tight">{props.title}</h1>
      {props.available ? (
        <ol className="mt-6 space-y-3">
          {props.items.map((item) => (
            <li key={`${item.position}-${item.label}`} className="rounded-xl border border-[#8A8478] px-4 py-3 text-sm">
              {item.position + 1}. {item.label}
            </li>
          ))}
        </ol>
      ) : null}
      <p className="mt-4 text-sm" aria-live="polite">
        {props.ariaLive}
      </p>
      {props.changes.length ? (
        <ul className="mt-4 space-y-2 text-sm">
          {props.changes.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      ) : null}
      {props.cta ? (
        <a href="/knowledge/goals" className="mt-6 inline-flex h-12 items-center rounded-xl bg-[#1E4E8C] px-4 text-sm font-medium text-white">
          {props.cta}
        </a>
      ) : null}
    </section>
  );
}
