export async function transcribeWithGrokStt(
  bytes: Buffer,
  filename: string,
  mime: string,
): Promise<string> {
  const key = process.env.XAI_API_KEY?.trim();
  if (!key) {
    throw new Error("stt_unavailable");
  }
  const blob = new Blob([new Uint8Array(bytes)], { type: mime || "application/octet-stream" });
  const body = new FormData();
  body.append("file", blob, filename || "audio.webm");
  body.append("model", process.env.XAI_STT_MODEL?.trim() || "grok-stt");

  const res = await fetch("https://api.x.ai/v1/stt", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` },
    body,
  });
  if (!res.ok) {
    const fallback = await fetch("https://api.x.ai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body,
    });
    if (!fallback.ok) throw new Error("stt_failed");
    const data = (await fallback.json()) as { text?: string };
    const text = data.text?.trim();
    if (!text) throw new Error("stt_empty");
    return text;
  }
  const data = (await res.json()) as { text?: string };
  const text = data.text?.trim();
  if (!text) throw new Error("stt_empty");
  return text;
}
