import type { Metadata } from "next";
import { AiKeysPanel } from "./ai-keys-panel";

export const metadata: Metadata = {
  title: "Connect AI",
  description: "Org default is platform credits or your own key. The page shows the last four characters only.",
};

export default function AiKeysPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AiKeysPanel />
    </main>
  );
}
