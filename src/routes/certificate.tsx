import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GROK_BOT_SLUG } from "@/lib/course/types";

export const Route = createFileRoute("/certificate")({
  component: () => (
    <Navigate
      to="/c/$courseSlug/certificate"
      params={{ courseSlug: GROK_BOT_SLUG }}
    />
  ),
});
