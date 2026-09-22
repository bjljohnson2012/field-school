export type LessonSpec = {
  id: string;
  org: string;
  title: string;
  outcome: string;
  units: { id: string; title: string; source_unit_id: string }[];
  mode: "teach" | "assign" | "video";
};
