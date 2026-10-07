import type { Metadata } from "next";
import { TeachLive } from "./live";

export const metadata: Metadata = {
  title: "Teach live",
  description: "Presenter view of the open path. Family is one child with no login.",
};

export default function TeachLivePage() {
  return <TeachLive />;
}
