const ALLOWED = ["fs_payload_spike", "fs_payload_b", "fs_payload_collide"];

export function assertLocalSpikeUrl(url: string, expected?: string): string {
  if (!url || url.trim() === "") throw new Error("missing database url");
  if (/fieldschool|2\.24\.|neon\.tech|amazonaws|supabase|railway|render\.com/i.test(url)) {
    throw new Error("refusing non-local database");
  }
  const match = url.match(/fs_payload_(spike|b|collide)/);
  if (!match) throw new Error("refusing database outside disposable spike names");
  const name = `fs_payload_${match[1]}`;
  if (!ALLOWED.includes(name)) throw new Error("refusing database name");
  if (expected && name !== expected) throw new Error(`refusing database, expected ${expected}`);
  return url;
}
