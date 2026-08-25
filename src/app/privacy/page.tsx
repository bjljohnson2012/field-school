import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { DEAN_EMAIL, DEAN_NAME } from "@/lib/campus";

const LAST_UPDATED = "2026-08-22";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Field School collects, uses, and stores information on fieldschool.ai and portal.fieldschool.ai.",
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
        Field School operates the campus at{" "}
        <a href="https://fieldschool.ai" className="underline underline-offset-2">
          https://fieldschool.ai
        </a>{" "}
        and{" "}
        <a
          href="https://portal.fieldschool.ai"
          className="underline underline-offset-2"
        >
          https://portal.fieldschool.ai
        </a>
        . This policy explains what we collect when you walk the campus, how we
        use it, and how to reach us. We do not sell personal data.
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
              use Auth.js Google or X sign-in, we receive the name and email
              your provider shares so we can confirm you are on the staff
              allowlist and open admin tools. Guest, local name, and the Jordan
              demo never grant admin. Staff is invite-only.
              <br />
              <br />
              <strong className="text-foreground">Member accounts.</strong> Free
              beta members may join with Google, X, or email and password. We
              store the name, email, provider, and a password hash (never the
              raw password) on the campus server. Staff access requests include
              name, email, provider, time, and an optional note.
              <br />
              <br />
              <strong className="text-foreground">
                Optional certificate label.
              </strong>{" "}
              If you type a name and optional email on sign-in to keep a
              dashboard, those values stay in this browser so certificates and
              progress can show your name.
              <br />
              <br />
              <strong className="text-foreground">Usage on this device.</strong>{" "}
              Course progress, quiz answers, tool results, and guest walks are
              stored in browser localStorage on this device. Member login is a
              server account. Course progress is still per browser until we
              sync it.
            </>
          }
        />
        <Block
          kicker="02"
          title="How we use it"
          body="We use this information to operate the educational portal, grant staff admin access to allowlisted people, run free beta member sign-in, review staff access requests, remember what you finished on this device, issue certificates with the name you typed, and improve courses and campus tools. We do not use it to sell ads or sell your data."
        />
        <Block
          kicker="03"
          title="Processors and hosting"
          body="If you choose Google or X sign-in, that provider is the identity processor for the OAuth handshake. Optional request-notify email uses SMTP only when those host settings are present. The live campus is hosted on our servers at fieldschool.ai and portal.fieldschool.ai. Those processors see only what is needed to authenticate, notify, or serve the site."
        />
        <Block
          kicker="04"
          title="Cookies and localStorage"
          body="Auth.js uses session cookies so Google, X, and email-password members stay signed in. The campus also writes localStorage keys for theme, guest or local progress, and a staff gate marker after a real staff session. Passwords are not stored in localStorage. Clearing site data on this browser removes guest progress."
        />
        <Block
          kicker="05"
          title="Retention"
          body="Guest and local labels live in this browser until you clear them or sign out of the local session. Member accounts and access requests live in the campus store on the server until we delete them at your request. Staff OAuth session data lasts as long as the Auth.js session and provider token rules require. We keep operational logs only as long as needed to run and secure the campus."
        />
        <Block
          kicker="06"
          title="We do not sell personal data"
          body="The campus is an educational portal. Field School does not sell personal information, does not rent mailing lists, and does not share your name or email with advertisers."
        />
        <Block
          kicker="07"
          title="Children"
          body="This campus is not directed at children under 13. We do not knowingly collect personal information from children under 13. If you believe a child under 13 provided information, write to us and we will delete what we can control."
        />
        <Block
          kicker="08"
          title="Your choices"
          body="You can keep walking as a guest without a login. You can skip the optional email on the certificate form. You can clear this site’s cookies and localStorage in your browser. Members and staff can sign out to end the Auth.js session. To ask us to delete member or staff records we control, email the contact below."
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
