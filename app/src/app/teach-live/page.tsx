import type { Metadata } from "next";
import { TeachLive } from "./live";

export const metadata: Metadata = {
  title: "Teach live",
  description: "Presenter view of the open path. Household is one tracked child with no login.",
};

export default function TeachLivePage() {
  return <TeachLive />;
}
