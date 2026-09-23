import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const platesScript = join(dirname(fileURLToPath(import.meta.url)), "../../../../plates/scripts/pexels-broll.mjs");

export const LESSON_SPINE_BROLL_QUERY = "classroom";

type MountOptions = {
  cacheDir?: string;
  fetchImpl?: typeof fetch;
  apiKey?: string;
};

/** Plate request for LessonSpine. Cache hit skips the search. Unset key returns null. */
export async function lessonSpineLiveBroll(options: MountOptions = {}) {
  try {
    const mod = await import(pathToFileURL(platesScript).href);
    return await mod.mountLivePexelsBroll({
      requested: true,
      query: LESSON_SPINE_BROLL_QUERY,
      cacheDir: options.cacheDir ?? join(dirname(platesScript), "..", "cache", "pexels"),
      fetchImpl: options.fetchImpl,
      apiKey: options.apiKey,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "PEXELS_API_KEY is unset") return null;
    if (options.cacheDir || options.fetchImpl) throw error;
    return null;
  }
}
