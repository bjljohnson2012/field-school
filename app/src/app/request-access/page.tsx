import type { Metadata } from "next";
import { RequestAccessForm } from "./request-access-form";

export const metadata: Metadata = {
  title: "Request staff access",
  description: "Ask the dean for staff admin on the Field School training portal.",
};

export default function RequestAccessPage() {
  return <RequestAccessForm />;
}
