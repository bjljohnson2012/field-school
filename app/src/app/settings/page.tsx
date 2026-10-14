import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl tracking-tight">Settings</h1>
      <ul className="mt-6 grid gap-3 text-sm">
        <li>
          <Link href="/account">Account</Link>
        </li>
        <li>
          <Link href="/settings/billing">Billing</Link>
        </li>
        <li>
          <Link href="/settings/ai">AI</Link>
        </li>
      </ul>
    </main>
  );
}
