import { isStaffEmail } from "@/lib/auth/staff";

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 200;
export const MAX_NOTE_LENGTH = 2000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email?: string | null) {
  return (email ?? "").trim().toLowerCase();
}

export function isValidEmail(email?: string | null) {
  const mail = normalizeEmail(email);
  return Boolean(mail) && EMAIL_RE.test(mail);
}

export function passwordError(password?: string | null) {
  const value = password ?? "";
  if (value.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    return `Password must be at most ${MAX_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

/** Credentials never grant staff, even if the email is on the allowlist. */
export function roleForAuth(
  provider: string | undefined,
  email?: string | null,
): "admin" | "member" {
  if (provider === "credentials") return "member";
  return isStaffEmail(email) ? "admin" : "member";
}

export function isStaffOAuthProvider(provider?: string | null) {
  return provider === "google" || provider === "twitter";
}

/**
 * Staff admin requires an allowlisted email on Google or X.
 * Missing provider is treated as a legacy OAuth staff session
 * (those JWTs were only minted when sign-in rejected non-staff).
 */
export function isStaffSession(session?: {
  user?: {
    email?: string | null;
    provider?: string | null;
    role?: string | null;
  } | null;
} | null) {
  const email = session?.user?.email;
  if (!isStaffEmail(email)) return false;
  const provider = session?.user?.provider;
  if (provider === "credentials") return false;
  if (isStaffOAuthProvider(provider)) return true;
  if (!provider && session?.user?.role !== "member") return true;
  return false;
}

export function authErrorMessage(code?: string | null) {
  switch (code) {
    case "OAuthAccountNotLinked":
      return "That sign-in did not match an existing campus account. Join again with the same provider, or use email and password.";
    case "AccessDenied":
      return "Field School could not finish that sign-in. Join the free beta below, or request staff access after you are in.";
    case "Configuration":
      return "Campus sign-in is missing a provider setting. Use email and password, or try again later.";
    case "OAuthCallback":
    case "OAuthSignIn":
    case "Callback":
      return "That sign-in did not complete. Try Google or X again, or join with email and password.";
    case "CredentialsSignin":
      return "Email or password did not match. Try again, or join the free beta.";
    default:
      return "Sign-in did not finish. Join the free beta below, or use a different path.";
  }
}

export function accessRequestNotifyEmail() {
  return (
    process.env.ACCESS_REQUEST_NOTIFY_EMAIL?.trim() ||
    "bjljohnson2012@gmail.com"
  );
}
