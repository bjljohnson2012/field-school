import type { Metadata } from "next";
import { FrKb3Metering } from "@/components/fr-kb-3-metering";

export const metadata: Metadata = {
  title: "Metering",
  description:
    "Knowledge-brain use for Learn with Ben. Platform credits or BYOK monthly-only. Locked $100 / $200 / $1,000.",
};

export default function MeteringPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <FrKb3Metering />
    </main>
  );
}
