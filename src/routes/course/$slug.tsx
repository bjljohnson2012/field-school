import { createFileRoute, Navigate } from "@tanstack/react-router";
import { GROK_BOT_SLUG } from "@/lib/course/types";

export const Route = createFileRoute("/course/$slug")({
  component: LegacyStation,
});

function LegacyStation() {
  const { slug } = Route.useParams();
  return (
    <Navigate
      to="/c/$courseSlug/s/$slug"
      params={{ courseSlug: GROK_BOT_SLUG, slug }}
    />
  );
}
