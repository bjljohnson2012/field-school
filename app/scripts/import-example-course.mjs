import { exampleCoursePlan, planCounts } from "../src/lib/collections/project-course.ts";
import { refuseRemoteApply, scriptFlags } from "../src/lib/tenancy/script.ts";

const flags = scriptFlags(process.argv.slice(2));
const plan = exampleCoursePlan("field-school");
console.log(JSON.stringify({ mode: flags.mode, counts: planCounts(plan) }));
if (!flags.apply) process.exit(0);

const refusal = refuseRemoteApply(process.env.DATABASE_URL ?? "", flags);
if (refusal) {
  console.error(refusal);
  process.exit(1);
}

const { ensureExampleCourse } = await import("../src/lib/collections/load-course.ts");
await ensureExampleCourse();
