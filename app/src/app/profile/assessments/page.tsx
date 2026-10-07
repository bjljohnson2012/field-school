import type { Metadata } from "next";
import { Suspense } from "react";
import { AssessmentWizard } from "@/components/profile-m2/assessment-wizard";

export const metadata: Metadata = { title: "Assessments" };

export default function AssessmentsPage() {
  return (
    <Suspense>
      <AssessmentWizard />
    </Suspense>
  );
}
