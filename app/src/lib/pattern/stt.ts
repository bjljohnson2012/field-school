import { transcribe } from "../ai/client";

export async function transcribeWithGrokStt(
  bytes: Buffer,
  filename: string,
  mime: string,
): Promise<string> {
  return transcribe(bytes, filename, mime);
}
