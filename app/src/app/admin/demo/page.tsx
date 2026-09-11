import { demoWalkPath, resolveDemoLinkToken } from "@/lib/demo-link";
import { StudentDemoClient } from "./student-demo-client";

export const dynamic = "force-dynamic";

export default function StudentDemoPage() {
  const token = resolveDemoLinkToken();
  return <StudentDemoClient demoPath={token ? demoWalkPath(token) : null} />;
}
