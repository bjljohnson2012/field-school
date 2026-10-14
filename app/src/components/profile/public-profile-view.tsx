import type { PublicProfile } from "@/lib/profile/public";

/** Renders the sealed allowlist only. Callers pass serializePublicProfile output. */
export function PublicProfileView({ profile }: { profile: PublicProfile }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-14" data-public-profile="adult">
      <div className="flex items-center gap-4">
        {profile.photo ? (
          <img src={profile.photo} alt="" className="size-16 rounded-full border border-border object-cover" />
        ) : null}
        <div>
          <h1 className="font-display text-4xl tracking-tight">{profile.displayName}</h1>
          {profile.headline ? <p className="mt-2 text-lg text-muted-foreground">{profile.headline}</p> : null}
        </div>
      </div>
      {profile.bio ? <p className="mt-6 text-sm leading-relaxed">{profile.bio}</p> : null}
      {profile.skills.length ? (
        <ul className="mt-6 flex flex-wrap gap-2" data-public-skills>
          {profile.skills.map((skill) => (
            <li key={skill.name} className="rounded-full border border-border px-2 py-0.5 text-xs">
              {skill.name}
            </li>
          ))}
        </ul>
      ) : null}
      {profile.projects.length ? (
        <ul className="mt-6 space-y-2 text-sm" data-public-projects>
          {profile.projects.map((project) => (
            <li key={project.name}>
              {project.link ? (
                <a href={project.link} className="underline underline-offset-4">
                  {project.name}
                </a>
              ) : (
                project.name
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {profile.linkedinUrl ? (
        <p className="mt-6 text-sm">
          <a href={profile.linkedinUrl} className="underline underline-offset-4">
            LinkedIn
          </a>
        </p>
      ) : null}
    </main>
  );
}
