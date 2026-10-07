export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
export const PHOTO_MAX_SIDE = 8192;

export type PhotoMime = "image/jpeg" | "image/png" | "image/webp";

export type Photo = { mime: PhotoMime; width: number; height: number; bytes: Uint8Array };

export type PhotoRefusal = "photo_too_large" | "photo_type_unsupported" | "photo_unreadable" | "photo_dimensions";

const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u32be = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const u16le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);
const u32le = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
const ascii = (b: Uint8Array, i: number, n: number) => String.fromCharCode(...b.subarray(i, i + n));

function concat(parts: readonly Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let at = 0;
  for (const part of parts) {
    out.set(part, at);
    at += part.length;
  }
  return out;
}

type Stripped = { width: number; height: number; bytes: Uint8Array } | null;

/** Keeps JFIF (APP0), ICC (APP2), and Adobe (APP14); drops EXIF/XMP (APP1), IPTC, other APPn, and comments. */
const JPEG_KEEP_APP = new Set([0xe0, 0xe2, 0xee]);

function stripJpeg(b: Uint8Array): Stripped {
  const parts: Uint8Array[] = [b.subarray(0, 2)];
  let i = 2;
  let size: { width: number; height: number } | null = null;
  while (i + 4 <= b.length) {
    if (b[i] !== 0xff) return null;
    const marker = b[i + 1];
    if (marker === 0xff) {
      i += 1;
      continue;
    }
    if (marker === 0xd9) {
      parts.push(b.subarray(i, i + 2));
      break;
    }
    if ((marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
      parts.push(b.subarray(i, i + 2));
      i += 2;
      continue;
    }
    const length = u16be(b, i + 2);
    const end = i + 2 + length;
    if (length < 2 || end > b.length) return null;
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof && length >= 7) size = { height: u16be(b, i + 5), width: u16be(b, i + 7) };
    if (marker === 0xda) {
      parts.push(b.subarray(i));
      return size ? { ...size, bytes: concat(parts) } : null;
    }
    const isApp = marker >= 0xe0 && marker <= 0xef;
    const drop = marker === 0xfe || (isApp && !JPEG_KEEP_APP.has(marker));
    if (!drop) parts.push(b.subarray(i, end));
    i = end;
  }
  return null;
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const PNG_DROP = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"]);

function stripPng(b: Uint8Array): Stripped {
  const parts: Uint8Array[] = [b.subarray(0, 8)];
  let i = 8;
  let size: { width: number; height: number } | null = null;
  while (i + 12 <= b.length) {
    const length = u32be(b, i);
    const type = ascii(b, i + 4, 4);
    const end = i + 12 + length;
    if (end > b.length) return null;
    if (i === 8) {
      if (type !== "IHDR" || length < 8) return null;
      size = { width: u32be(b, i + 8), height: u32be(b, i + 12) };
    }
    if (!PNG_DROP.has(type)) parts.push(b.subarray(i, end));
    i = end;
    if (type === "IEND") return size ? { ...size, bytes: concat(parts) } : null;
  }
  return null;
}

const VP8X_XMP = 0x04;
const VP8X_EXIF = 0x08;

function webpSize(type: string, data: Uint8Array): { width: number; height: number } | null {
  if (type === "VP8X" && data.length >= 10) return { width: u24le(data, 4) + 1, height: u24le(data, 7) + 1 };
  if (type === "VP8L" && data.length >= 5 && data[0] === 0x2f) {
    const bits = u32le(data, 1);
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 };
  }
  if (type === "VP8 " && data.length >= 10 && data[3] === 0x9d && data[4] === 0x01 && data[5] === 0x2a) {
    return { width: u16le(data, 6) & 0x3fff, height: u16le(data, 8) & 0x3fff };
  }
  return null;
}

function stripWebp(b: Uint8Array): Stripped {
  if (b.length < 20 || ascii(b, 8, 4) !== "WEBP") return null;
  const riffEnd = 8 + u32le(b, 4);
  if (riffEnd > b.length) return null;
  const parts: Uint8Array[] = [];
  let i = 12;
  let size: { width: number; height: number } | null = null;
  while (i + 8 <= riffEnd) {
    const type = ascii(b, i, 4);
    const length = u32le(b, i + 4);
    const end = i + 8 + length + (length % 2);
    if (i + 8 + length > riffEnd) return null;
    const data = b.subarray(i + 8, i + 8 + length);
    size ??= webpSize(type, data);
    if (type === "VP8X") {
      const chunk = b.slice(i, Math.min(end, riffEnd));
      chunk[8] &= ~(VP8X_XMP | VP8X_EXIF);
      parts.push(chunk);
    } else if (type !== "EXIF" && type !== "XMP ") {
      parts.push(b.subarray(i, Math.min(end, riffEnd)));
    }
    i = end;
  }
  if (!size) return null;
  const body = concat(parts);
  const header = new Uint8Array(12);
  header.set(b.subarray(0, 12));
  new DataView(header.buffer).setUint32(4, body.length + 4, true);
  return { ...size, bytes: concat([header, body]) };
}

function sniff(b: Uint8Array): PhotoMime | null {
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length >= 8 && PNG_SIGNATURE.every((byte, i) => b[i] === byte)) return "image/png";
  if (b.length >= 12 && ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") return "image/webp";
  return null;
}

/**
 * The type comes from the bytes, never from a filename or a Content-Type header.
 * Location, camera, and text metadata are removed before anything is stored.
 */
export function readPhoto(bytes: Uint8Array): { ok: true; photo: Photo } | { ok: false; error: PhotoRefusal } {
  if (bytes.length > PHOTO_MAX_BYTES) return { ok: false, error: "photo_too_large" };
  const mime = sniff(bytes);
  if (!mime) return { ok: false, error: "photo_type_unsupported" };
  const stripped = mime === "image/jpeg" ? stripJpeg(bytes) : mime === "image/png" ? stripPng(bytes) : stripWebp(bytes);
  if (!stripped) return { ok: false, error: "photo_unreadable" };
  const { width, height } = stripped;
  if (width < 1 || height < 1 || width > PHOTO_MAX_SIDE || height > PHOTO_MAX_SIDE) {
    return { ok: false, error: "photo_dimensions" };
  }
  return { ok: true, photo: { mime, width, height, bytes: stripped.bytes } };
}
