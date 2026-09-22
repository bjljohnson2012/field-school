import type { Metadata } from "next";
import { TeachDeck, type LessonSpec } from "@/components/teach-deck";

export const metadata: Metadata = {
  title: "Teach live",
  description: "Presenter view of one lesson for a leader in the sales org.",
};

const lesson: LessonSpec = {
  id: "spec-sales-next-step",
  org: "sales",
  title: "The next step while you are in the room",
  outcome:
    "The teammate can name the next step on their path and keep moving after this session ends.",
  mode: "teach",
  units: [
    {
      id: "unit-who-now",
      title: "Who they are now",
      source_unit_id: "src-who-now",
    },
    {
      id: "unit-next-step",
      title: "The next step that fits",
      source_unit_id: "src-next-step",
    },
    {
      id: "unit-after",
      title: "What still runs when you leave",
      source_unit_id: "src-after-you-leave",
    },
  ],
};

export default function TeachLivePage() {
  return <TeachDeck spec={lesson} />;
}
