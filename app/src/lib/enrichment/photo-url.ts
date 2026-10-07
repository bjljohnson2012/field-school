export const PHOTO_URL_MAX = 2048;

/** https on 443 only, no credentials, no bare IP literals. The URL is stored as provenance, never served. */
export function parsePhotoUrl(raw: unknown): URL | null {
  if (typeof raw !== "string" || raw.length > PHOTO_URL_MAX) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.username || url.password) return null;
  if (url.port && url.port !== "443") return null;
  if (!url.hostname.includes(".") || isIpLiteral(url.hostname)) return null;
  return url;
}

function isIpLiteral(host: string) {
  return host.startsWith("[") || /^\d+(\.\d+){0,3}$/.test(host) || /^0x/i.test(host);
}

function ipv4Octets(address: string): number[] | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : NaN));
  return octets.every((octet) => octet >= 0 && octet <= 255) ? octets : null;
}

function publicIpv4([a, b, c]: number[]): boolean {
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 192 && b === 0 && (c === 0 || c === 2)) return false;
  if (a === 198 && (b === 18 || b === 19)) return false;
  if (a === 198 && b === 51 && c === 100) return false;
  if (a === 203 && b === 0 && c === 113) return false;
  return true;
}

function ipv6Groups(address: string): number[] | null {
  const [head, tail, extra] = address.toLowerCase().split("::");
  if (extra !== undefined) return null;
  const parse = (part: string | undefined) => {
    if (!part) return [];
    const out: number[] = [];
    for (const group of part.split(":")) {
      const v4 = ipv4Octets(group);
      if (v4) out.push((v4[0] << 8) | v4[1], (v4[2] << 8) | v4[3]);
      else if (/^[0-9a-f]{1,4}$/.test(group)) out.push(parseInt(group, 16));
      else return null;
    }
    return out;
  };
  const left = parse(head);
  const right = parse(tail);
  if (!left || !right) return null;
  const fill = 8 - left.length - right.length;
  if (tail === undefined ? fill !== 0 : fill < 1) return null;
  return [...left, ...Array.from({ length: Math.max(fill, 0) }, () => 0), ...right];
}

function publicIpv6(groups: number[]): boolean {
  const [g0, g1] = groups;
  if (groups.slice(0, 5).every((g) => g === 0) && groups[5] === 0xffff) {
    return publicIpv4([groups[6] >> 8, groups[6] & 0xff, groups[7] >> 8, groups[7] & 0xff]);
  }
  if (groups.slice(0, 7).every((g) => g === 0)) return false;
  if (g0 === 0x64 && g1 === 0xff9b) return false;
  if ((g0 & 0xfe00) === 0xfc00 || (g0 & 0xffc0) === 0xfe80 || (g0 & 0xff00) === 0xff00) return false;
  if (g0 === 0x2001 && g1 === 0x0db8) return false;
  if (g0 === 0x2002) return false;
  if (g0 === 0x2001 && g1 < 0x0200) return false;
  return true;
}

/** True only for globally routable unicast. Loopback, private, link-local, metadata, and mapped forms are refused. */
export function isPublicAddress(address: string): boolean {
  const v4 = ipv4Octets(address);
  if (v4) return publicIpv4(v4);
  const v6 = ipv6Groups(address);
  return v6 ? publicIpv6(v6) : false;
}
