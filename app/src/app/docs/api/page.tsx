import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Campus API",
  description:
    "Wave 1 Field School campus API: identity, progress, learning events, and Postgres schema.",
  robots: { index: false, follow: false },
};

function Code({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded-xl border border-border bg-secondary/40 p-4 text-xs leading-relaxed">
      <code>{children}</code>
    </pre>
  );
}

function Block({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      {kicker ? (
        <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
          {kicker}
        </p>
      ) : null}
      <h2 className="font-display text-2xl tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </section>
  );
}

export default function ApiDocsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Integration
      </p>
      <h1 className="mt-3 font-display text-4xl tracking-tight sm:text-5xl">
        Campus API — Wave 1
      </h1>
      <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
        Learner identity and Grok Bot progress on the live Next campus. Guests
        stay in the browser. Signed-in watch and quiz writes Postgres. This
        page is unlisted from search.
      </p>
      <p className="mt-3 text-sm text-muted-foreground">
        OpenAPI:{" "}
        <a href="/docs/openapi-wave1.json" className="underline underline-offset-2">
          /docs/openapi-wave1.json
        </a>
        . Station 01:{" "}
        <Link href="/c/grok-bot/s/briefing" className="underline underline-offset-2">
          /c/grok-bot/s/briefing
        </Link>
        .
      </p>

      <div className="mt-12 space-y-12">
        <Block kicker="01" title="How it works">
          <ol className="list-decimal space-y-2 pl-5">
            <li>
              Guest walks Grok Bot. Progress is <code>localStorage</code>.{" "}
              <code>POST /api/events</code> returns 401.
            </li>
            <li>
              A signed-in Auth.js member is upserted into <code>members</code> and
              given a <code>memberships</code> row on org <code>field-school</code>.
            </li>
            <li>
              Watch, quiz, and field work on station 01 post{" "}
              <code>learning_events</code>.
            </li>
            <li>
              <code>GET /api/progress?course=grok-bot</code> rebuilds that
              membership’s map. Every query is scoped by <code>org_id</code> and{" "}
              <code>membership_id</code>.
            </li>
            <li>
              Org <code>household</code> exists and does not see Field School
              operator catalog events. User B does not see user A.
            </li>
          </ol>
          <p>
            Base URL <code>https://portal.fieldschool.ai</code>.{" "}
            <code>university.benjohnson.ai</code> 301s to portal. AUTH_URL is
            portal. Cookies are Auth.js session cookies.
          </p>
        </Block>

        <Block kicker="02" title="Seed orgs">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/60 text-foreground">
                <tr>
                  <th className="px-3 py-2 font-medium">slug</th>
                  <th className="px-3 py-2 font-medium">kind</th>
                  <th className="px-3 py-2 font-medium">isolation</th>
                  <th className="px-3 py-2 font-medium">group</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-foreground">field-school</td>
                  <td className="px-3 py-2">operator</td>
                  <td className="px-3 py-2">public_catalog</td>
                  <td className="px-3 py-2">cohort-0</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-foreground">household</td>
                  <td className="px-3 py-2">homeschool</td>
                  <td className="px-3 py-2">strict</td>
                  <td className="px-3 py-2">family</td>
                </tr>
                <tr className="border-t border-border">
                  <td className="px-3 py-2 text-foreground">sales</td>
                  <td className="px-3 py-2">company</td>
                  <td className="px-3 py-2">platform_plus</td>
                  <td className="px-3 py-2">desk</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>New memberships default to stance learner. Staff emails get admin.</p>
        </Block>

        <Block kicker="03" title="Postgres schema">
          <p>
            Postgres 16 + pgvector. Database <code>campus</code>. Container{" "}
            <code>field-school-campus-db</code>. Data{" "}
            <code>/opt/field-school/postgres</code>. Not the leftover TanStack
            database <code>field-school-db</code>.
          </p>
          <p className="text-foreground">organizations</p>
          <p>
            id uuid PK, slug unique, name, kind, isolation, created_at.
          </p>
          <p className="text-foreground">members</p>
          <p>id uuid PK, email unique, name, created_at.</p>
          <p className="text-foreground">memberships</p>
          <p>
            id uuid PK, org_id, member_id, stance, created_at. Unique (org_id,
            member_id).
          </p>
          <p className="text-foreground">groups / group_memberships</p>
          <p>
            groups: org_id + slug unique. group_memberships: (group_id,
            membership_id).
          </p>
          <p className="text-foreground">assignments</p>
          <p>
            org_id, membership_id, object_type, object_id, status, raw jsonb.
            Table is in Wave 1; station field work currently writes a{" "}
            <code>learning_events</code> row of kind <code>assignment</code>.
          </p>
          <p className="text-foreground">learning_events (spine)</p>
          <p>
            org_id, membership_id, actor_membership_id, actor_stance, kind (
            <code>watch</code> | <code>quiz</code> | <code>assignment</code>),
            object_type, object_id (<code>grok-bot:briefing</code>), skill_ids
            text[], score numeric, raw jsonb, created_at.
          </p>
        </Block>

        <Block kicker="04" title="GET /api/me">
          <p>Guest:</p>
          <Code>{`{ "authenticated": false, "guest": true }`}</Code>
          <p>Signed in:</p>
          <Code>{`{
  "authenticated": true,
  "member": { "id": "uuid", "email": "a@example.com", "name": "Ada" },
  "org": { "slug": "field-school", "isolation": "public_catalog" },
  "memberships": [
    { "id": "uuid", "stance": "learner", "org": "field-school", "isolation": "public_catalog" }
  ]
}`}</Code>
        </Block>

        <Block kicker="05" title="GET /api/progress?course=grok-bot">
          <p>Guest returns an empty module map. Signed in returns only this membership.</p>
          <Code>{`{
  "authenticated": true,
  "course": "grok-bot",
  "org": "field-school",
  "membershipId": "uuid",
  "modules": {
    "briefing": {
      "watched": true,
      "assignment": { "list8": true },
      "notes": "",
      "quizScore": 4,
      "quizPassed": true,
      "passed": true
    }
  }
}`}</Code>
        </Block>

        <Block kicker="06" title="POST /api/events">
          <p>
            Guest is 401 <code>sign_in_required</code>. Kind must be watch, quiz,
            or assignment.
          </p>
          <Code>{`{
  "kind": "quiz",
  "course": "grok-bot",
  "station": "briefing",
  "score": 4,
  "raw": { "passed": true, "answers": { "q1": 1 } }
}`}</Code>
          <p>Success:</p>
          <Code>{`{ "ok": true, "id": "uuid", "org": "field-school", "membershipId": "uuid" }`}</Code>
          <p>
            Station 01 sends watch when the clip is marked, assignment when field
            work is saved, quiz on submit. <code>object_id</code> defaults to{" "}
            <code>{"{course}:{station}"}</code>.
          </p>
        </Block>

        <Block kicker="07" title="curl">
          <Code>{`curl -sS https://portal.fieldschool.ai/api/me
curl -sS "https://portal.fieldschool.ai/api/progress?course=grok-bot"
curl -sS -X POST https://portal.fieldschool.ai/api/events \\
  -H "content-type: application/json" \\
  -d '{"kind":"watch","course":"grok-bot","station":"briefing"}'`}</Code>
          <p>
            POST without a session cookie is 401. Sign in on{" "}
            <Link href="/login" className="underline underline-offset-2">
              /login
            </Link>
            , then call from that browser.
          </p>
        </Block>

        <Block kicker="08" title="What this is not">
          <ul className="list-disc space-y-1 pl-5">
            <li>Not Cap or the edit MCP.</li>
            <li>Not campus MCP (Wave 7) or wildcard hosts (Wave 2).</li>
            <li>Not Better Auth / PGlite / migrations 0001–0003.</li>
            <li>AUTH_URL is portal.fieldschool.ai. University 301s there.</li>
          </ul>
        </Block>
      </div>
    </main>
  );
}
