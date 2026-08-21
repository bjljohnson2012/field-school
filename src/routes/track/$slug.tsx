import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/track/$slug")({
  component: () => <Outlet />,
});
