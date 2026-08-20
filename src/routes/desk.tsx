import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GROK_BOT_SLUG } from "@/lib/course/types";

export const Route = createFileRoute("/desk")({
  component: () => (
    <Navigate to="/c/$courseSlug/desk" params={{ courseSlug: GROK_BOT_SLUG }} />
  ),
});
