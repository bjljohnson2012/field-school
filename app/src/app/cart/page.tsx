import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Cart",
  description: "That seat is not offered. See pricing, or email Ben.",
};

export default function CartPage() {
  redirect("/pricing");
}
