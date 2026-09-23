import { GUEST_SOFT_NOTES } from "@/lib/player/soft-craft-guest";

/** Guests can read the soft-craft notes. They do not write. */
export function LessonSpineGuestSoftPanel() {
  return (
    <section
      className="mt-6 max-w-2xl"
      data-guest-soft-panel="soft-craft"
      data-login="none"
      data-distribute="false"
      data-cleaning-flip="false"
    >
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Soft notes</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Household: the child has no login. Sales: this desk lists no children. Guests do not write.
      </p>
      <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
        {GUEST_SOFT_NOTES.map((note) => (
          <li key={note.kind} data-soft-note={note.kind}>
            {note.label}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted-foreground">Cleaning stays held. Launch stays closed.</p>
    </section>
  );
}
