import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Video in",
};

export default function VideoInLayout({ children }: { children: ReactNode }) {
  return children;
}
