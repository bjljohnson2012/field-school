export function scriptFlags(argv: readonly string[]) {
  const apply = argv.includes("--apply") && !argv.includes("--dry-run");
  return {
    apply,
    allowRemote: argv.includes("--allow-remote"),
    mode: apply ? ("apply" as const) : ("dry-run" as const),
  };
}

export function isLocalDatabase(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  try {
    const host = new URL(trimmed).hostname;
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return false;
  }
}

export function refuseRemoteApply(
  url: string,
  flags: { apply: boolean; allowRemote: boolean },
): "database_missing" | "refusing_remote_apply" | null {
  if (!flags.apply) return null;
  if (!url.trim()) return "database_missing";
  if (isLocalDatabase(url) || flags.allowRemote) return null;
  return "refusing_remote_apply";
}
