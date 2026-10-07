import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { request } from "node:https";
import type { LookupFunction } from "node:net";
import { PHOTO_MAX_BYTES } from "./media";
import { isPublicAddress, parsePhotoUrl } from "./photo-url";

export type FetchRefusal = "photo_url_invalid" | "photo_url_blocked" | "photo_fetch_failed" | "photo_too_large";

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 8000;

/**
 * Resolution and the public-address check happen inside the socket's own lookup, so the
 * address that was checked is the address that is dialled. A private answer fails the connect.
 */
const publicOnlyLookup: LookupFunction = (hostname, options, callback) => {
  dnsLookup(hostname, { all: true }, (error, addresses: LookupAddress[]) => {
    if (error) return callback(error, "", 4);
    const usable = addresses.filter((entry) => isPublicAddress(entry.address));
    if (!usable.length || usable.length !== addresses.length) {
      const blocked = Object.assign(new Error("photo_url_blocked"), { code: "EBLOCKED" });
      return callback(blocked, "", 4);
    }
    if (options.all) return callback(null, usable);
    return callback(null, usable[0].address, usable[0].family);
  });
};

type Hop = { kind: "body"; bytes: Uint8Array } | { kind: "redirect"; location: string } | { kind: "error"; error: FetchRefusal };

function hop(url: URL): Promise<Hop> {
  return new Promise((resolve) => {
    const req = request(
      url,
      {
        method: "GET",
        lookup: publicOnlyLookup,
        headers: { accept: "image/jpeg,image/png,image/webp", "user-agent": "FieldSchoolPhotoFetch/1" },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 300 && status < 400 && res.headers.location) {
          res.resume();
          return resolve({ kind: "redirect", location: res.headers.location });
        }
        if (status !== 200) {
          res.resume();
          return resolve({ kind: "error", error: "photo_fetch_failed" });
        }
        const declared = Number(res.headers["content-length"] ?? 0);
        if (declared > PHOTO_MAX_BYTES) {
          res.destroy();
          return resolve({ kind: "error", error: "photo_too_large" });
        }
        const chunks: Buffer[] = [];
        let total = 0;
        res.on("data", (chunk: Buffer) => {
          total += chunk.length;
          if (total > PHOTO_MAX_BYTES) {
            res.destroy();
            resolve({ kind: "error", error: "photo_too_large" });
            return;
          }
          chunks.push(chunk);
        });
        res.on("end", () => resolve({ kind: "body", bytes: new Uint8Array(Buffer.concat(chunks)) }));
        res.on("error", () => resolve({ kind: "error", error: "photo_fetch_failed" }));
      },
    );
    req.on("timeout", () => req.destroy(new Error("timeout")));
    req.on("error", (error: NodeJS.ErrnoException) => {
      resolve({ kind: "error", error: error.code === "EBLOCKED" ? "photo_url_blocked" : "photo_fetch_failed" });
    });
    req.end();
  });
}

/** Fetches a pasted photo link once so the bytes can be stored on campus. Every redirect is re-checked. */
export async function fetchPhoto(raw: string): Promise<{ ok: true; bytes: Uint8Array; finalUrl: string } | { ok: false; error: FetchRefusal }> {
  let url = parsePhotoUrl(raw);
  if (!url) return { ok: false, error: "photo_url_invalid" };
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const result = await hop(url);
    if (result.kind === "body") return { ok: true, bytes: result.bytes, finalUrl: url.toString() };
    if (result.kind === "error") return { ok: false, error: result.error };
    let next: URL | null;
    try {
      next = parsePhotoUrl(new URL(result.location, url).toString());
    } catch {
      next = null;
    }
    if (!next) return { ok: false, error: "photo_url_blocked" };
    url = next;
  }
  return { ok: false, error: "photo_fetch_failed" };
}
