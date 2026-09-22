import type { Metadata } from "next";
import { AssignDesk } from "./assign-desk";

export const metadata: Metadata = {
  title: "Assign",
};

export default function AssignPage() {
  return <AssignDesk />;
}
