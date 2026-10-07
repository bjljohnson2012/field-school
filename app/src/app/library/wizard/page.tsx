import type { Metadata } from "next";
import { WizardClient } from "./wizard-client";

export const metadata: Metadata = {
  title: "Wizard",
  description:
    "Drop a file, an idea, or a minute of audio. Submit adds it to the knowledge. Generate Lesson writes the lesson after.",
};

export default function LibraryWizardPage() {
  return <WizardClient />;
}
