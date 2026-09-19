import { authErrorMessage } from "@/lib/members/policy";
import type { OAuthProviderStatus } from "@/lib/auth/env";

/**
 * Auth.js sends `error=Configuration` when the OAuth canonical host and
 * the page host differ. Google still completes. Hide that false banner
 * whenever a real Google provider is wired.
 */
export function visibleLoginProviderError(
  code: string | null | undefined,
  oauth: Pick<OAuthProviderStatus, "google" | "configured">,
): string | null {
  if (!code) return null;
  if (code === "Configuration" && (oauth.google || oauth.configured)) {
    return null;
  }
  return authErrorMessage(code);
}
