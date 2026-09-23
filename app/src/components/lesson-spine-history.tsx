import Link from "next/link";
import { lessonSpineStep, lessonSpineTrail } from "@/lib/player/play-rail-write";

/** History of LessonSpine steps already stored on the living brain. */
export function LessonSpineHistory(props: {
  marks: Array<{ outcomes: string }>;
  current?: string;
  membershipId: string;
}) {
  const trail = lessonSpineTrail(props.marks, props.current);
  const other = props.marks.filter((mark) => {
    const outcomes = mark.outcomes.trim();
    return !lessonSpineStep(outcomes) && outcomes !== "rail remotion" && outcomes !== "rail html5";
  });
  if (!trail.length && !other.length) return null;
  return (
    <div data-history={props.membershipId} data-history-count={props.marks.length}>
      {trail.length ? (
        <>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-foreground">History</p>
          <ol className="mt-1 space-y-0.5 text-xs text-muted-foreground" data-lesson-spine-trail="living-brain">
            {trail.map((step, index) => (
              <li key={`${index}-${step}`} data-lesson-spine-next={step}>
                <Link href="/play/lesson-spine">{step}</Link>
              </li>
            ))}
          </ol>
        </>
      ) : null}
      {other.length ? (
        <ol className="mt-1 space-y-0.5 text-xs text-muted-foreground">
          {other.map((mark, index) => (
            <li key={`${index}-${mark.outcomes}`}>{mark.outcomes}</li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}
