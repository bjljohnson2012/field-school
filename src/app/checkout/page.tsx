import { redirect } from "next/navigation";
import { getPaidPlan } from "@/lib/billing/plans";

export const dynamic = "force-dynamic";

type CheckoutSearch = {
  plan?: string | string[];
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<CheckoutSearch>;
}) {
  const plan = getPaidPlan(firstValue((await searchParams).plan));
  if (!plan) redirect("/pricing");
  redirect(plan.checkoutUrl);
}
