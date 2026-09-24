import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isTaskAdmin } from "@/app/api/coaching/tasks/access";
import { listTasks, loadAssigneeChoices } from "@/app/api/coaching/tasks/persist";
import { loadTaskActor } from "@/app/api/coaching/tasks/session";
import { TasksBoard, type AssigneeChoice, type TaskItem } from "./tasks-board";
import { RetakeSection } from "./retake-section";
import { loadCoachRetakes, type CoachRetake } from "./retakes";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tasks" };

export default async function TasksPage() {
  const loaded = await loadTaskActor();
  if (!loaded.ok) {
    if (loaded.status === 401) redirect("/login?next=/tasks");
    return (
      <main>
        <h1 className="h-page">Tasks</h1>
        <section className="card mt-6 p-6">
          <p>No open tasks.</p>
        </section>
      </main>
    );
  }

  let tasks: TaskItem[] = [];
  let assignees: AssigneeChoice[] = [];
  let retakes: CoachRetake[] = [];
  let coach = false;
  try {
    tasks = await listTasks(loaded.world, loaded.actor);
    assignees = await loadAssigneeChoices(loaded.world, loaded.actor);
  } catch {
    tasks = [];
    assignees = [];
  }
  try {
    const loadedRetakes = await loadCoachRetakes(loaded.world, loaded.actor);
    retakes = loadedRetakes.requests;
    coach = loadedRetakes.isCoach;
  } catch {
    retakes = [];
    coach = false;
  }

  return (
    <main>
      <h1 className="h-page">Tasks</h1>
      <p className="mt-2 text-sm text-muted-foreground">Open work for this org. An empty list is fine.</p>
      <TasksBoard
        initialTasks={tasks}
        assignees={assignees}
        actorMembershipId={loaded.actor.membershipId}
        admin={isTaskAdmin(loaded.world, loaded.actor)}
      />
      {coach ? <RetakeSection requests={retakes} /> : null}
    </main>
  );
}
