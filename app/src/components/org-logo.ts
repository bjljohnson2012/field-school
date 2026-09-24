/** Read organizations.features.logoUrl. A missing or blank URL stays the monogram. */
export function readOrgLogoUrl(features: unknown): string {
  if (!features || typeof features !== "object" || Array.isArray(features)) return "";
  const logoUrl = (features as { logoUrl?: unknown }).logoUrl;
  if (typeof logoUrl !== "string") return "";
  return logoUrl.trim();
}
