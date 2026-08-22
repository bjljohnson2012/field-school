/** True when Auth.js can mint sessions (required for any OAuth flow). */
export function hasAuthSecret() {
  return Boolean(process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET);
}

export function hasGoogleOAuthEnv() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}

export function hasTwitterOAuthEnv() {
  const id =
    process.env.AUTH_TWITTER_ID?.trim() ||
    process.env.X_CLIENT_ID?.trim() ||
    process.env.TWITTER_CLIENT_ID?.trim();
  const secret =
    process.env.AUTH_TWITTER_SECRET?.trim() ||
    process.env.X_CLIENT_SECRET?.trim() ||
    process.env.TWITTER_CLIENT_SECRET?.trim();
  return Boolean(id && secret);
}

/** Any configured OAuth provider plus AUTH_SECRET. */
export function authIsConfigured() {
  return (
    hasAuthSecret() && (hasGoogleOAuthEnv() || hasTwitterOAuthEnv())
  );
}

export type OAuthProviderStatus = {
  configured: boolean;
  google: boolean;
  twitter: boolean;
};

export function getOAuthProviderStatus(): OAuthProviderStatus {
  const secret = hasAuthSecret();
  return {
    configured: authIsConfigured(),
    google: secret && hasGoogleOAuthEnv(),
    twitter: secret && hasTwitterOAuthEnv(),
  };
}
