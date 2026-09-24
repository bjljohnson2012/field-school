import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadLibraryCoach } from "@/app/api/coaching/knowledge/access";
import { listProducts } from "@/app/api/coaching/products/library";
import { DatabaseUnavailableError } from "@/lib/db/client";
import { ProductsEditor, type ProductRow } from "./products-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Products" };

export default async function CoachingProductsPage() {
  const loaded = await loadLibraryCoach();
  if (!loaded.ok) {
    if (loaded.response.status === 401) redirect("/login?next=/coaching/products");
    return (
      <main>
        <h1 className="h-page">Products</h1>
        <section className="card mt-6 p-6">
          <p>Product editing is limited to coaches.</p>
        </section>
      </main>
    );
  }

  let rows: ProductRow[] = [];
  try {
    rows = await listProducts(loaded.actor.orgId);
  } catch (error) {
    if (!(error instanceof DatabaseUnavailableError)) throw error;
  }

  return (
    <main>
      <h1 className="h-page">Products</h1>
      <p className="mt-2 text-sm text-muted-foreground">Signed in as {loaded.name}</p>
      <ProductsEditor initial={rows} />
    </main>
  );
}
