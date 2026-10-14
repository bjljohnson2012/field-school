import type { Metadata } from "next";
import { OFFER_NAMES } from "@/lib/shell/m9-shell";

export const metadata: Metadata = { title: "Team practice" };

export default function TeamServicesPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-muted-foreground">Team practice</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Services</h1>
      <ul className="mt-6 list-disc pl-5 text-sm">
        {OFFER_NAMES.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>
      <p className="mt-6 text-sm">
        <a className="m9-outline" href="https://fieldschool.ai/pricing">
          See pricing
        </a>
      </p>
    </main>
  );
}
