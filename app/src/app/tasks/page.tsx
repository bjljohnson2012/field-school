import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isTaskAdmin } from "@/app/api/coaching/tasks/access";
import { listTasks, loadAssigneeChoices } from "@/app/api/coaching/tasks/persist";
import { loadTaskActor } from "@/app/api/coaching/tasks/session";
import { TasksBoard, type AssigneeChoice, type TaskItem } from "./tasks-board";

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
  try {
    tasks = await listTasks(loaded.world, loaded.actor);
    assignees = await loadAssigneeChoices(loaded.world, loaded.actor);
  } catch {
    tasks = [];
    assignees = [];
  }

  return (
    <main>
      <h1 className="h-page">Tasks</h1>
      <p className="mt-2 text-sm text-gray-600">Open work for this org. An empty list is fine.</p>
      <TasksBoard
        initialTasks={tasks}
        assignees={assignees}
        actorMembershipId={loaded.actor.membershipId}
        admin={isTaskAdmin(loaded.world, loaded.actor)}
      />
    </main>
  );
}
