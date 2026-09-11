import Link from "next/link";
import { StaffFooterLinks } from "@/components/staff-footer-links";
import { COMPANY_NAME } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="text-foreground">{COMPANY_NAME}</span> is the
          organization. This site is the training portal. Learn AI, sales,
          go-to-market, and leadership at your pace.
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <Link href="/about" className="hover:text-foreground">
            About
          </Link>
          <Link href="/pricing" className="hover:text-foreground">
            Pricing
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Join
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <Link href="/tools" className="hover:text-foreground">
            Tools
          </Link>
          <Link href="/share/field-school" className="hover:text-foreground">
            Share
          </Link>
          <Link href="/c/grok-bot" className="hover:text-foreground">
            Catalog
          </Link>
          <StaffFooterLinks />
        </div>
      </div>
    </footer>
  );
}
