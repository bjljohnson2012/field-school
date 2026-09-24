import Link from "next/link";
import { StaffFooterLinks } from "@/components/staff-footer-links";
import { COMPANY_NAME } from "@/lib/brand";

const stoneLink = "text-muted-foreground hover:text-foreground";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-sm sm:flex-row sm:items-start sm:justify-between">
        <p className="text-muted-foreground">
          <span className="text-foreground">{COMPANY_NAME}</span> is the
          organization. This site is the training portal. Learn AI, sales,
          go-to-market, and leadership at your pace.
        </p>
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
              Field School site
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <Link href="/about" className={stoneLink}>
                About
              </Link>
              <Link href="/pricing" className={stoneLink}>
                Pricing
              </Link>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link href="/pattern" className={stoneLink}>
              Pattern
            </Link>
            <Link href="/docs/api" className={stoneLink}>
              API
            </Link>
            <Link href="/signup" className={stoneLink}>
              Join
            </Link>
            <Link href="/privacy" className={stoneLink}>
              Privacy
            </Link>
            <Link href="/terms" className={stoneLink}>
              Terms
            </Link>
            <Link href="/share/field-school" className={stoneLink}>
              Share
            </Link>
            <Link href="/c/grok-bot" className={stoneLink}>
              Catalog
            </Link>
            <StaffFooterLinks />
          </div>
        </div>
      </div>
    </footer>
  );
}
