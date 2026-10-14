/** PM3 route helpers. Kid profile URLs move to People with the M9 permanent redirect. */

const SAFE_ID = /^[A-Za-z0-9_-]{1,80}$/;

export function kidProfileRedirect(pathname: string): { href: string; status: 301 } | null {
  const path = pathname.split("?")[0].replace(/\/+$/, "") || "/";
  const match = /^\/profile\/kids\/([^/]+)$/.exec(path);
  if (!match) return null;
  const id = match[1] ?? "";
  if (!SAFE_ID.test(id) || id === "." || id === "..") return null;
  return { href: `/people/${id}`, status: 301 };
}
