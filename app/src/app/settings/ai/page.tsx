import type { Metadata } from "next";
import { identityFromRequest } from "@/lib/campus-runtime/identity";
import { AiKeysPanel } from "./ai-keys-panel";

export const metadata: Metadata = {
  title: "Connect AI",
  description: "Org default is platform credits or your own key. The page shows the last four characters only.",
};

export default async function AiKeysPage() {
  const auth = await identityFromRequest();
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <AiKeysPanel initialError={auth.ok ? null : auth.error} />
    </main>
  );
}
