import { notifyEnrollment } from "@/lib/members/notify";
import { createAccessRequest } from "@/lib/members/store";

export async function recordNewEnrollment(input: {
  name: string;
  email: string;
}) {
  const result = await createAccessRequest({
    name: input.name,
    email: input.email,
    provider: "enrollment",
    note: "New enrollment on the free beta.",
    kind: "enrollment",
  });
  if (!result.ok) {
    return { filed: false as const, emailed: false };
  }
  try {
    const notify = await notifyEnrollment(result.request);
    return {
      filed: true as const,
      emailed: notify.emailed,
      request: result.request,
    };
  } catch (error) {
    console.error("[enrollment] notify failed", error);
    return {
      filed: true as const,
      emailed: false,
      request: result.request,
    };
  }
}
