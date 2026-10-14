import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** The one filled blue on a view. 48px tall, 44px circle, 20px icon, Plex 16/600. */
export function DiscoverButton({ href, children }: { href: string; children: string }) {
  return (
    <Link href={href} data-discover="true" className="m9-discover">
      <span className="m9-discover-label">{children}</span>
      <span className="m9-discover-circle" aria-hidden="true">
        <ArrowRight size={20} />
      </span>
    </Link>
  );
}
