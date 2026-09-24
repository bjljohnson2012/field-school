import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ACCOUNT_LOGIN, accountAccess } from "@/app/api/coaching/account/password/route";
import { auth } from "@/auth";
import { passwordError } from "@/lib/members/policy";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account" };

function noticeFor(code: string | undefined) {
  if (code === "current") return "Current password did not match.";
  if (code === "short") return passwordError("short");
  if (code === "long") return passwordError("x".repeat(201));
  if (code === "mismatch") return "New password did not match the confirmation.";
  if (code === "failed") return "Password could not be changed.";
  return null;
}

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const session = await auth().catch(() => null);
  const email = session?.user?.email?.trim() || "";
  if (accountAccess(email) === "login") redirect(ACCOUNT_LOGIN);

  const params = await searchParams;
  const saved = params.saved === "1";
  const notice = noticeFor(params.error);

  return (
    <main className="mx-auto max-w-6xl px-6 py-8">
      <p className="eyebrow">Member</p>
      <h1 className="h-page mt-2">Account</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Change the password for {email}.
      </p>
      <section className="card mt-6 max-w-md p-6">
        {saved ? (
          <p className="mb-4 text-sm text-foreground" role="status">
            Password updated.
          </p>
        ) : null}
        {notice ? (
          <p className="mb-4 rounded-brand border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" role="alert">
            {notice}
          </p>
        ) : null}
        <form method="post" action="/api/coaching/account/password" className="space-y-4">
          <div>
            <label className="label" htmlFor="account-current">
              Current password
            </label>
            <input
              id="account-current"
              name="currentPassword"
              type="password"
              required
              autoComplete="current-password"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="account-new">
              New password
            </label>
            <input
              id="account-new"
              name="newPassword"
              type="password"
              required
              autoComplete="new-password"
              className="input"
            />
          </div>
          <div>
            <label className="label" htmlFor="account-confirm">
              Confirm new password
            </label>
            <input
              id="account-confirm"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
              className="input"
            />
          </div>
          <button type="submit" className="btn-primary">
            Update password
          </button>
        </form>
      </section>
    </main>
  );
}
