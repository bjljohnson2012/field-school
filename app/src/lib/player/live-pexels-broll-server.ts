import { tmpdir } from "node:os";
import { join } from "node:path";
import { mountLivePexelsBroll, pexelsAuthorization } from "./pexels-broll.mjs";
import { PEXELS_API_KEY_ENV } from "./pexels-env.ts";

export const LESSON_SPINE_BROLL_QUERY = "classroom";

type MountOptions = {
  cacheDir?: string;
  fetchImpl?: typeof fetch;
  apiKey?: string;
};

/** Plate request for LessonSpine. Static in-app import. Unset key returns null. */
export async function lessonSpineLiveBroll(options: MountOptions = {}) {
  let apiKey: string;
  try {
    apiKey = pexelsAuthorization(options.apiKey ?? process.env[PEXELS_API_KEY_ENV]);
  } catch (error) {
    if (error instanceof Error && error.message === "PEXELS_API_KEY is unset") return null;
    throw error;
  }
  return mountLivePexelsBroll({
    requested: true,
    query: LESSON_SPINE_BROLL_QUERY,
    cacheDir: options.cacheDir ?? join(tmpdir(), "field-school-pexels"),
    fetchImpl: options.fetchImpl,
    apiKey,
  });
}

export async function lessonSpineBrollPayload(options: MountOptions = {}) {
  const broll = await lessonSpineLiveBroll(options);
  return { ok: true, broll, distribute: false };
}
