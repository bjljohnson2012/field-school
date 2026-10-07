import { redirect } from "next/navigation";
import { identityFromRequest } from "@/lib/campus-runtime/identity";

const HIRER_STANCES = new Set(["admin", "guardian", "trainer", "teacher"]);

/** Leaders open on Insights. Everyone else opens on Learn. */
export default async function DashboardPage() {
  let destination = "/learn";
  try {
    const auth = await identityFromRequest();
    if (auth.ok && auth.identity.kind !== "child" && HIRER_STANCES.has(auth.identity.stance)) {
      destination = "/insights";
    }
  } catch {
    destination = "/learn";
  }
  redirect(destination);
}
