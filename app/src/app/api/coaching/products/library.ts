import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { products } from "@/lib/db/schema";

export class ProductError extends Error {
  code: string;
  status: number;
  constructor(code: string, status: number) {
    super(code);
    this.name = "ProductError";
    this.code = code;
    this.status = status;
  }
}

export function slugify(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "product";
}

export function productDto(row: typeof products.$inferSelect) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    summary: row.summary,
    audience: row.audience,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function uniqueViolation(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message.includes("23505") || message.includes("products_org_slug");
}

export async function listProducts(orgId: string) {
  const db = getDb();
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.orgId, orgId))
    .orderBy(desc(products.createdAt));
  return rows.map(productDto);
}

export async function createProduct(input: {
  orgId: string;
  name: string;
  summary?: string | null;
  audience?: string | null;
  active?: boolean;
}) {
  const name = input.name.trim();
  if (!name) throw new ProductError("invalid_body", 400);
  const db = getDb();
  try {
    const [row] = await db
      .insert(products)
      .values({
        orgId: input.orgId,
        slug: slugify(name),
        name,
        summary: input.summary?.trim() || null,
        audience: input.audience?.trim() || null,
        active: input.active !== false,
      })
      .returning();
    if (!row) throw new ProductError("store_failed", 500);
    return productDto(row);
  } catch (error) {
    if (error instanceof ProductError) throw error;
    if (uniqueViolation(error)) throw new ProductError("duplicate_product", 409);
    throw error;
  }
}

export async function updateProduct(input: {
  orgId: string;
  id: string;
  name?: string;
  summary?: string | null;
  audience?: string | null;
  active?: boolean;
}) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, input.id), eq(products.orgId, input.orgId)))
    .limit(1);
  if (!existing) throw new ProductError("not_found", 404);
  const name = input.name === undefined ? existing.name : input.name.trim();
  if (!name) throw new ProductError("invalid_body", 400);
  try {
    const [row] = await db
      .update(products)
      .set({
        name,
        slug: input.name === undefined ? existing.slug : slugify(name),
        summary: input.summary === undefined ? existing.summary : input.summary?.trim() || null,
        audience: input.audience === undefined ? existing.audience : input.audience?.trim() || null,
        active: input.active === undefined ? existing.active : input.active,
        updatedAt: new Date(),
      })
      .where(eq(products.id, existing.id))
      .returning();
    if (!row) throw new ProductError("not_found", 404);
    return productDto(row);
  } catch (error) {
    if (error instanceof ProductError) throw error;
    if (uniqueViolation(error)) throw new ProductError("duplicate_product", 409);
    throw error;
  }
}

export async function deleteProduct(orgId: string, id: string) {
  const db = getDb();
  const [existing] = await db
    .select()
    .from(products)
    .where(and(eq(products.id, id), eq(products.orgId, orgId)))
    .limit(1);
  if (!existing) throw new ProductError("not_found", 404);
  await db.delete(products).where(eq(products.id, existing.id));
  return { id: existing.id };
}
