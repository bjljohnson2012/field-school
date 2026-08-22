import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY_NAME, UNI_NAME } from "@/lib/brand";
import { DEAN_EMAIL, DEAN_NAME } from "@/lib/campus";

const LAST_UPDATED = "2026-08-22";
const SITE_ORIGIN = "https://university.benjohnson.ai";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms for using ${UNI_NAME}, the educational portal operated by ${COMPANY_NAME}.`,
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Terms
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Terms of Service
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        These terms govern your use of {UNI_NAME} at {SITE_ORIGIN}, operated by{" "}
        {COMPANY_NAME} ({DEAN_NAME}). By using the campus you accept them. If
        you do not, do not use the site.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated {LAST_UPDATED}.
      </p>

      <section className="mt-12 space-y-10">
        <Block
          kicker="01"
          title="Acceptance"
          body={`Using ${UNI_NAME} — including walking a course as a guest, labeling a local dashboard, or signing in as staff — means you agree to these terms and to the Privacy Policy.`}
        />
        <Block
          kicker="02"
          title="Educational and demo nature"
          body={`${UNI_NAME} is an educational portal and working campus. Some paths are demos (including the Jordan student walk). Course material, certificates, and tools are for learning and practice. They are not professional, legal, financial, or medical advice, and they are not a degree-granting program.`}
        />
        <Block
          kicker="03"
          title="Accounts"
          body="Free beta members may join with Google, X, or email and password. That membership does not include staff admin. Staff admin access requires Auth.js Google or X sign-in with an email on the staff allowlist. Guest progress, local name labels, and the Jordan demo stay on this device and never grant admin. You are responsible for the browser and accounts you use to reach staff tools."
        />
        <Block
          kicker="04"
          title="Acceptable use"
          body="Use the campus for learning and legitimate staff work. Do not attempt to bypass the staff allowlist, impersonate another person, disrupt the service, scrape or overload the site, upload malware, or use the portal to break the law. We may suspend access if these terms are abused."
        />
        <Block
          kicker="05"
          title="Intellectual property"
          body={`Course text, videos, assessments, branding, and campus software belong to ${COMPANY_NAME} or its licensors. You may use them to learn on this portal. You may not copy the catalog wholesale, resell the courses, or present the campus as your own product without written permission.`}
        />
        <Block
          kicker="06"
          title="Disclaimer of warranties"
          body={`${UNI_NAME} is provided “as is” and “as available.” ${COMPANY_NAME} does not warrant that the campus will be uninterrupted, error-free, or fit for a particular purpose. Progress stored only in this browser can be lost if you clear site data.`}
        />
        <Block
          kicker="07"
          title="Limitation of liability"
          body={`To the fullest extent permitted by law, ${COMPANY_NAME} and ${DEAN_NAME} are not liable for indirect, incidental, special, consequential, or punitive damages, or for lost progress, lost certificates, or lost profits, arising from your use of the campus. Our total liability for a claim relating to the site will not exceed the amount you paid us for it in the prior twelve months (currently $0 for the public campus).`}
        />
        <Block
          kicker="08"
          title="Changes"
          body="We may update these terms as the campus grows (for example when paid invoices or synced course progress ship). The last-updated date at the top will change. Continued use after a change means you accept the new terms."
        />
        <Block
          kicker="09"
          title="Governing law"
          body="These terms are governed by the laws of the State of Ohio, United States, without regard to conflict-of-law rules. Courts in Ohio have venue for disputes that cannot be resolved informally, to the extent that is allowed."
        />
      </section>

      <section className="mt-14 rounded-xl border border-border bg-card px-5 py-6">
        <h2 className="font-display text-2xl tracking-tight">Contact</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Questions about these terms go to {DEAN_NAME} at{" "}
          <a href={`mailto:${DEAN_EMAIL}`} className="underline underline-offset-2">
            {DEAN_EMAIL}
          </a>
          . Related:{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/about" className="underline underline-offset-2">
            About
          </Link>
          .
        </p>
      </section>
    </main>
  );
}

function Block({
  kicker,
  title,
  body,
}: {
  kicker: string;
  title: string;
  body: string;
}) {
  return (
    <article>
      <p className="font-mono text-xs text-muted-foreground">{kicker}</p>
      <h2 className="mt-2 font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}
