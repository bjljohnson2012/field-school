export const WRITES_DISABLED = "writes_disabled";

export function requireCoachingWrite(
  env: { COACHING_WRITES?: string | undefined } = process.env,
): Response | null {
  const raw = env.COACHING_WRITES;
  const value = raw == null ? "" : String(raw).trim();
  if (value !== "" && value !== "0") return null;
  return Response.json({ error: WRITES_DISABLED }, { status: 403 });
}
