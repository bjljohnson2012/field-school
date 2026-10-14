/**
 * PM3 share slugs. CDM sealed this on 2026-10-14, delegated by Ben.
 * Opaque, URL-safe, at least 10 characters. Never a membership id.
 * Off until the adult opts in. Revoke clears the slug. The next opt-in mints a new one.
 */

export const SHARE_SLUG_MIN = 10;
export const SHARE_SLUG_MAX = 80;
const SLUG_RE = /^[A-Za-z0-9_-]{10,80}$/;
const MEMBERSHIP_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type ShareState = { enabled: boolean; slug: string | null };
export type ShareAction = "enable" | "revoke";

export function initialShareState(): ShareState {
  return { enabled: false, slug: null };
}

export function isShareSlug(value: string): boolean {
  return SLUG_RE.test(value) && !MEMBERSHIP_ID_RE.test(value);
}

/** Map raw bytes to a URL-safe slug. Rejects anything on the blocked list, including a membership id. */
export function mintShareSlug(bytes: Uint8Array, blocked: readonly string[] = []): string {
  if (bytes.length < SHARE_SLUG_MIN) throw new Error("slug_entropy_short");
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let slug = "";
  for (let i = 0; i < 16; i += 1) {
    slug += alphabet[bytes[i] % alphabet.length];
  }
  if (!isShareSlug(slug) || blocked.includes(slug)) {
    const next = alphabet[(alphabet.indexOf(slug[15]) + 1) % alphabet.length];
    slug = `${slug.slice(0, 15)}${next}`;
  }
  if (!isShareSlug(slug) || blocked.includes(slug)) throw new Error("slug_blocked");
  return slug;
}

export function nextShareState(
  current: ShareState,
  action: ShareAction,
  mint: () => string,
  blocked: readonly string[] = [],
): ShareState {
  if (action === "revoke") return { enabled: false, slug: null };
  if (current.enabled && current.slug && isShareSlug(current.slug) && !blocked.includes(current.slug)) {
    return { enabled: true, slug: current.slug };
  }
  const avoid = new Set(blocked.filter(Boolean));
  if (current.slug) avoid.add(current.slug);
  let slug = mint();
  if (avoid.has(slug) || !isShareSlug(slug)) slug = mint();
  if (avoid.has(slug) || !isShareSlug(slug)) throw new Error("slug_blocked");
  return { enabled: true, slug };
}

export function shareMintStatus(kind: string): 403 | 200 {
  return kind === "child" ? 403 : 200;
}

/** Public routes never resolve a child, a revoked slug, or a slug that is not the live one. */
export function publicViewStatus(input: {
  kind: string;
  shareEnabled: boolean;
  slug: string | null;
  requestedSlug: string;
}): 404 | 200 {
  if (input.kind === "child") return 404;
  if (!input.shareEnabled || !input.slug) return 404;
  if (!isShareSlug(input.slug) || input.slug !== input.requestedSlug) return 404;
  return 200;
}
