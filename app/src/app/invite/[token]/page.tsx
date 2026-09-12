"use client";

import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function InvitePage() {
  const { token } = useParams<{ token: string }>();
  const { status } = useSession();
  const router = useRouter();
  const [note, setNote] = useState<string | null>(null);

  async function accept() {
    const res = await fetch("/api/invites/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) {
      setNote(data.error || "Could not accept.");
      return;
    }
    router.push(`/o/${data.org}`);
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Invite</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Join this org</h1>
      <p className="mt-4 text-muted-foreground">
        Sign in with the invited email, then accept. Your other memberships stay.
      </p>
      {status !== "authenticated" ? (
        <Link href={`/login?next=/invite/${token}`} className="mt-6 inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm text-primary-foreground">
          Sign in to accept
        </Link>
      ) : (
        <Button className="mt-6" onClick={() => void accept()}>
          Accept invite
        </Button>
      )}
      {note ? <p className="mt-4 text-sm text-destructive">{note}</p> : null}
    </main>
  );
}
