"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { KID_INTAKE, ONBOARDING_COPY } from "@/lib/onboarding/graph";

export function KidProfileForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="mt-6 space-y-4"
      data-form-name={KID_INTAKE.name}
      data-no-photo="true"
      data-no-public-url="true"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        try {
          const res = await fetch("/api/onboarding", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: { type: "kid-intake", displayName: name } }),
          });
          const data = (await res.json()) as { error?: string; landing?: string | null };
          if (!res.ok) {
            setError(data.error || "Could not save the kid profile.");
            return;
          }
          router.push("/onboarding");
        } catch {
          setError("Could not save the kid profile.");
        } finally {
          setPending(false);
        }
      }}
    >
      <h1 className="font-display text-4xl tracking-tight">{ONBOARDING_COPY.kidTitle}</h1>
      <p className="text-sm text-[#5C5850]">{ONBOARDING_COPY.kidBody}</p>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <label className="block text-sm" htmlFor="kid-profile-name">
        Name
      </label>
      <input
        id="kid-profile-name"
        className="h-12 w-full rounded-xl border border-[#8A8478] px-3"
        value={name}
        onChange={(event) => setName(event.target.value)}
        required
      />
      <button
        className="h-12 w-full rounded-xl bg-[#1E4E8C] text-sm font-medium text-white"
        type="submit"
        disabled={pending}
      >
        {ONBOARDING_COPY.continue}
      </button>
    </form>
  );
}
