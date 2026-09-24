import Link from "next/link";

/** Guest continuity contract. Copy only. No new persistence store. */
export function GuestContinuity() {
  return (
    <section
      data-guest-continuity="s2"
      className="rounded-xl border border-border px-5 py-5 text-sm leading-relaxed text-muted-foreground"
    >
      <h2 className="font-display text-xl tracking-tight text-foreground">
        What a guest keeps
      </h2>
      <ul className="mt-3 list-disc space-y-2 pl-5">
        <li>
          The campus ladder, stations, desk, and exam open without an account.
        </li>
        <li>
          A desk draft does not survive refresh. Use Save desk. The desk does
          not save itself, and it does not sync to the cloud.
        </li>
        <li>
          A station quiz selection does not survive refresh. You can retake.
          Pass stays 75% (3/4).
        </li>
        <li>
          The exam is 8/10. A certificate needs the whole ladder plus the exam.
          An exam selection does not survive refresh. You can open and submit
          the exam without an account. A submitted exam score stays in this
          browser. It is not an account record.
        </li>
        <li>LessonSpine: guests play. Guests do not write.</li>
        <li>
          Metering: a guest can read the model.{" "}
          <Link href="/login?next=/metering" className="underline">
            Sign in
          </Link>{" "}
          to own the hire session.
        </li>
        <li>
          An account keeps saved station progress for that membership: a
          watched clip, saved field work, and a submitted station quiz. The
          desk and the exam still do not sync to the account.
        </li>
      </ul>
    </section>
  );
}
