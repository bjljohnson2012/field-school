import { selectSupervisedIntent } from "@/lib/progress/supervised-intent";
import { selectSupervisedPath } from "@/lib/progress/supervised-path";
import { selectSupervisedPortion } from "@/lib/progress/supervised-portion";
import { selectSupervisedChild } from "@/lib/progress/supervised";
import { writeSupervisedBrain } from "@/lib/progress/supervised-brain";

export function hirePathBrainHint(childId: string | null) {
  const intent = selectSupervisedIntent(childId);
  const path = selectSupervisedPath(childId);
  const portion = selectSupervisedPortion(childId, {
    pathItems: path.selected?.items || [],
    horizon: intent.selected?.timeHorizon || "",
    name: path.selected?.name || intent.selected?.name,
  });
  const progress = selectSupervisedChild(childId);
  return {
    intent: intent.selected
      ? {
          goals: intent.selected.goals,
          subjects: intent.selected.subjects,
          themes: intent.selected.themes,
          timeHorizon: intent.selected.timeHorizon,
          constraints: intent.selected.constraints,
          name: intent.selected.name,
        }
      : undefined,
    pathItems: path.selected?.items || [],
    portion: portion.selected
      ? { horizon: portion.selected.horizon, items: portion.selected.items }
      : undefined,
    progress: progress.selected
      ? {
          now: progress.selected.now,
          confidence: progress.selected.confidence,
          next: progress.selected.next,
        }
      : undefined,
    name: path.selected?.name || intent.selected?.name || progress.selected?.name,
  };
}

export function syncHirePathBrain(childId: string | null) {
  const id = String(childId || "").trim();
  return writeSupervisedBrain(id, "sync", hirePathBrainHint(id));
}
