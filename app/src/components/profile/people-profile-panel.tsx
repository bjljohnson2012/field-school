import { PERSON_IN_DEVELOPMENT } from "@/lib/profile/public";
import { loadPeopleStrip } from "@/lib/profile/public-store";

/** Read-mostly profile column on People. A person in development has no photo and no public link. */
export async function PeopleProfilePanel(props: {
  kind: string;
  displayName: string;
  memberId: string;
  membershipId: string;
  orgId: string;
}) {
  const panel = await loadPeopleStrip(props);
  if (panel.kind === "development") {
    return (
      <section className="mt-6 rounded-xl border border-border bg-card px-5 py-5" data-person="development">
        <p className="text-sm font-semibold">{PERSON_IN_DEVELOPMENT}</p>
        <h2 className="mt-1 font-display text-2xl tracking-tight">{props.displayName}</h2>
      </section>
    );
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-card px-5 py-5" data-profile-panel="adult">
      <div className="flex items-center gap-4">
        {panel.photo ? (
          <img src={panel.photo} alt="" data-profile-photo className="size-16 rounded-full border border-border object-cover" />
        ) : null}
        <div>
          <h2 className="font-display text-2xl tracking-tight">{panel.displayName}</h2>
          {panel.headline ? <p className="text-sm text-muted-foreground">{panel.headline}</p> : null}
        </div>
      </div>
      {panel.bio ? <p className="mt-4 text-sm leading-relaxed">{panel.bio}</p> : null}
      <ul className="mt-4 space-y-1 text-sm" data-projects>
        {panel.projects.map((project) => (
          <li key={project.name}>{project.name}</li>
        ))}
      </ul>
      <ul className="mt-4 flex flex-wrap gap-2" data-skills>
        {panel.skills.map((skill) => (
          <li key={skill} className="rounded-full border border-border px-2 py-0.5 text-xs">
            {skill}
          </li>
        ))}
      </ul>
      {panel.brain.length ? (
        <ul className="mt-4 space-y-1 text-sm" data-brain>
          {panel.brain.map((item) => (
            <li key={`${item.kind}:${item.label}`}>{item.label}</li>
          ))}
        </ul>
      ) : null}
      {panel.shareHref ? (
        <p className="mt-4 text-sm">
          <a href={panel.shareHref} className="underline underline-offset-4">
            Public profile
          </a>
        </p>
      ) : null}
    </section>
  );
}
