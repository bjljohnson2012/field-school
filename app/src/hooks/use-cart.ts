"use client";

import { useEffect, useState } from "react";
import { CART_STORAGE_KEY, parseCartValue } from "@/lib/billing/cart";
import { isPaidPlanId, type PaidPlanId } from "@/lib/billing/plans";

function readStoredPlanId() {
  if (typeof window === "undefined") return null;
  try {
    const value = parseCartValue(window.localStorage.getItem(CART_STORAGE_KEY));
    return isPaidPlanId(value) ? value : null;
  } catch {
    return null;
  }
}

export function writeCartPlan(planId: PaidPlanId) {
  window.localStorage.setItem(CART_STORAGE_KEY, planId);
  window.dispatchEvent(new Event("fs-cart"));
}

export function clearCart() {
  window.localStorage.removeItem(CART_STORAGE_KEY);
  window.dispatchEvent(new Event("fs-cart"));
}

export function useCart() {
  const [planId, setPlanId] = useState<PaidPlanId | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setPlanId(readStoredPlanId());
      setReady(true);
    };
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener("fs-cart", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("fs-cart", sync);
    };
  }, []);

  return {
    ready,
    planId,
    writePlan: writeCartPlan,
    clear: clearCart,
  };
}
