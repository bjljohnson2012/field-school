export const CART_STORAGE_KEY = "fs-cart";

export type CartItem = {
  planId: string;
};

export function parseCartValue(value: string | null | undefined): string | null {
  const planId = value?.trim() ?? "";
  return planId || null;
}
