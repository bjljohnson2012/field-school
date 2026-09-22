import type { Metadata } from "next";
import { WizardClient } from "./wizard-client";

export const metadata: Metadata = {
  title: "Wizard",
  description:
    "Questions for one lesson in this org: what it is, who it is for, what they should be able to do after, teach live or self-serve or both, and whether a video cut is needed.",
};

export default function LibraryWizardPage() {
  return <WizardClient />;
}
