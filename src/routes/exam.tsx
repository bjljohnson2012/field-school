import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GROK_BOT_SLUG } from "@/lib/course/types";

export const Route = createFileRoute("/exam")({
  component: () => (
    <Navigate to="/c/$courseSlug/exam" params={{ courseSlug: GROK_BOT_SLUG }} />
  ),
});
