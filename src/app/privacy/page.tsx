import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { COMPANY_NAME, UNI_NAME } from "@/lib/brand";
import { DEAN_EMAIL, DEAN_NAME } from "@/lib/campus";

const LAST_UPDATED = "2026-08-22";
const SITE_ORIGIN = "https://university.benjohnson.ai";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${COMPANY_NAME} collects, uses, and stores information on ${UNI_NAME}.`,
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Privacy
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Privacy Policy
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        {COMPANY_NAME} operates {UNI_NAME} at {SITE_ORIGIN}. This policy
        explains what we collect when you walk the campus, how we use it, and
        how to reach us. We do not sell personal data.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        Last updated {LAST_UPDATED}. Operator: {DEAN_NAME}.
      </p>

      <section className="mt-12 space-y-10">
        <Block
          kicker="01"
          title="What we collect"
          body={
            <>
              <strong className="text-foreground">Staff sign-in.</strong> If you
              use Auth.js Google (and later X) sign-in, we receive the name and
              email your provider shares so we can confirm you are on the staff
              allowlist and open admin tools. Guest, local name, and the Jordan
              demo never grant admin.
              <br />
              <br />
              <strong className="text-foreground">Optional certificate label.</strong>{" "}
              If you type a name and optional email on sign-in to keep a
              dashboard, those values stay in this browser so certificates and
              progress can show your name. They are not a full account.
              <br />
              <br />
              <strong className="text-foreground">Usage on this device.</strong>{" "}
              Course progress, quiz answers, tool results, and guest walks are
              stored in browser localStorage on this device. We do not yet run a
              multi-device student account system.
            </>
          }
        />
        <Block
          kicker="02"
          title="How we use it"
          body="We use this information to operate the educational portal, grant staff admin access to allowlisted people, remember what you finished on this device, issue Field School University certificates with the name you typed, and improve courses and campus tools. We do not use it to sell ads or sell your data."
        />
        <Block
          kicker="03"
          title="Processors and hosting"
          body="If you choose staff Google sign-in, Google is the identity processor for that OAuth handshake. X may be added the same way later. The live campus is hosted on our server at university.benjohnson.ai. Those processors see only what is needed to authenticate or serve the site."
        />
        <Block
          kicker="04"
          title="Cookies and localStorage"
          body="Staff OAuth uses session cookies so Auth.js can keep you signed in. The campus also writes localStorage keys for theme, guest or local progress, and a staff gate marker after a real staff session. Clearing site data on this browser removes guest progress. That is expected: guest progress is not a cloud account yet."
        />
        <Block
          kicker="05"
          title="Retention"
          body="Guest and local labels live in this browser until you clear them or sign out of the local session. Staff OAuth session data lasts as long as the Auth.js session and provider token rules require. We keep operational logs only as long as needed to run and secure the campus. There is no separate student data warehouse."
        />
        <Block
          kicker="06"
          title="We do not sell personal data"
          body={`${UNI_NAME} is an educational portal. ${COMPANY_NAME} does not sell personal information, does not rent mailing lists, and does not share your name or email with advertisers.`}
        />
        <Block
          kicker="07"
          title="Children"
          body="This campus is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 provided information, write to us and we will delete what we can control."
        />
        <Block
          kicker="08"
          title="Your choices"
          body="You can keep walking as a guest without a staff login. You can skip the optional email on the certificate form. You can clear this site’s cookies and localStorage in your browser. Staff can sign out to end the OAuth session. To ask us to delete staff-related records we control, email the contact below."
        />
      </section>

      <section className="mt-14 rounded-xl border border-border bg-card px-5 py-6">
        <h2 className="font-display text-2xl tracking-tight">Contact</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Privacy questions go to {DEAN_NAME} at{" "}
          <a href={`mailto:${DEAN_EMAIL}`} className="underline underline-offset-2">
            {DEAN_EMAIL}
          </a>
          . Related:{" "}
          <Link href="/terms" className="underline underline-offset-2">
            Terms of Service
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
  body: ReactNode;
}) {
  return (
    <article>
      <p className="font-mono text-xs text-muted-foreground">{kicker}</p>
      <h2 className="mt-2 font-display text-2xl tracking-tight">{title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </article>
  );
}
