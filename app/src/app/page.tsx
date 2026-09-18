import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { CampusHome } from "./campus-home";

export default async function Campus() {
  const session = await auth();
  if (session?.user?.email) redirect("/dashboard");
  return <CampusHome />;
}
