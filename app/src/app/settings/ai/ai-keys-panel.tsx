"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

const LOGIN_NEXT = "/login?next=/settings/ai";

type PublicKey = {
  provider: string;
  status: "active";
  last4: string;
};

type PublicState = {
  ok: true;
  org: string;
  membershipId: string;
  mode: "platform" | "byok";
  units: number;
  stored: boolean;
  key: PublicKey | null;
};

type ErrorBody = {
  ok?: false;
  error?: string;
};

type StateResponse = PublicState | ErrorBody;

function isPublicState(body: StateResponse): body is PublicState {
  return body.ok === true && (body.mode === "platform" || body.mode === "byok");
}

const JOB =
  "When I am accountable for people's development and for the organization's success, and I cannot sit with them every hour, I invest in Field School so each person keeps moving on a path fit to who they are now, they get better, the organization gets better, and the learning actually takes.";

function messageFor(code: string) {
  if (code === "sign_in_required") return "Sign in to set this org.";
  if (code === "child_cannot_write") return "A child does not set the org key.";
  if (code === "hirer_only") return "The hirer sets the org default.";
  if (code === "byok_key_required") return "Paste a key to use your own key.";
  if (code === "secret_invalid" || code === "secret_required") return "That key cannot be saved.";
  if (code === "wrap_key_missing" || code === "wrap_key_invalid") {
    return "Key wrap is not configured on this server. The key was not stored.";
  }
  if (code === "no_new_price") return "This page does not take a price or a charge.";
  if (code === "credits_unavailable" || code === "database_unavailable") {
    return "The credit ledger is not reachable from this server.";
  }
  if (code === "invalid_mode") return "Choose platform credits or your own key.";
  return "The org default could not be saved.";
}

export function AiKeysPanel({ initialError = null }: { initialError?: string | null }) {
  const [state, setState] = useState<PublicState | null>(null);
  const [error, setError] = useState<string | null>(initialError);
  const [mode, setMode] = useState<"platform" | "byok">("platform");
  const [provider, setProvider] = useState("");
  const [secret, setSecret] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/settings/ai/state")
      .then(async (res) => {
        const body = (await res.json().catch(() => ({}))) as StateResponse;
        if (cancelled) return;
        if (!res.ok || !isPublicState(body)) {
          setState(null);
          setError(("error" in body && body.error) || "credits_unavailable");
          return;
        }
        setError(null);
        setState(body);
        setMode(body.mode === "byok" ? "byok" : "platform");
        setProvider(body.key?.provider || "");
      })
      .catch(() => {
        if (!cancelled) setError("credits_unavailable");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/settings/ai/state", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode,
          provider,
          secret: mode === "byok" ? secret : "",
        }),
      });
      const body = (await res.json().catch(() => ({}))) as StateResponse;
      if (!res.ok || !isPublicState(body)) {
        setError(("error" in body && body.error) || "credits_unavailable");
        return;
      }
      setSecret("");
      setState(body);
      setMode(body.mode);
      setProvider(body.key?.provider || "");
    } catch {
      setError("credits_unavailable");
    } finally {
      setPending(false);
    }
  }

  async function revoke() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/settings/ai/state", { method: "DELETE" });
      const body = (await res.json().catch(() => ({}))) as StateResponse;
      if (!res.ok || !isPublicState(body)) {
        setError(("error" in body && body.error) || "credits_unavailable");
        return;
      }
      setSecret("");
      setState(body);
      setMode(body.mode);
      setProvider("");
    } catch {
      setError("credits_unavailable");
    } finally {
      setPending(false);
    }
  }

  const signedOut = error === "sign_in_required";
  const blocked = error === "child_cannot_write" || error === "hirer_only";
  const last4 = state?.key?.last4 || "";

  return (
    <section data-ai-keys="org-default">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Connect AI</p>
      <h1 className="mt-3 font-display text-4xl tracking-tight">Org default</h1>
      <p className="mt-4 max-w-2xl text-muted-foreground">
        This org uses platform credits or your own key. The choice stays on the org when you leave
        the room. It adds no price and does not charge a card.
      </p>
      <p className="mt-3 max-w-2xl text-sm text-muted-foreground" data-job="field-school">
        {JOB}
      </p>

      {signedOut ? (
        <p className="mt-6 text-sm" data-ai-session="guest">
          Sign in as the hirer for this org.{" "}
          <Link href={LOGIN_NEXT} className="underline">
            Sign in
          </Link>
        </p>
      ) : null}

      {blocked ? (
        <p className="mt-6 text-sm" data-ai-session="blocked">
          {messageFor(error || "")}
        </p>
      ) : null}

      {error && !signedOut && !blocked ? (
        <p className="mt-6 text-sm" data-ai-error={error}>
          {messageFor(error)}
        </p>
      ) : null}

      {state ? (
        <form className="mt-8 max-w-xl space-y-6" onSubmit={save}>
          <p className="text-sm" data-ai-org={state.org}>
            Active org: {state.org}.{" "}
            {state.stored
              ? state.mode === "byok"
                ? "Saved default is your key."
                : "Saved default is platform credits."
              : "No saved default yet. Platform credits apply until you save."}
          </p>
          <p className="text-sm" data-credit-units={String(state.units)}>
            {state.units} units on the org ledger.
          </p>

          <fieldset className="space-y-3">
            <legend className="text-sm font-medium">Org default</legend>
            <label className="flex items-start gap-3 rounded-xl border border-border px-4 py-3">
              <input
                type="radio"
                name="mode"
                value="platform"
                checked={mode === "platform"}
                onChange={() => setMode("platform")}
              />
              <span>
                <span className="block text-sm font-medium">Platform credits</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  Library jobs debit this org ledger. No card on this page.
                </span>
              </span>
            </label>
            <label className="flex items-start gap-3 rounded-xl border border-border px-4 py-3">
              <input
                type="radio"
                name="mode"
                value="byok"
                checked={mode === "byok"}
                onChange={() => setMode("byok")}
              />
              <span>
                <span className="block text-sm font-medium">Your key</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  The key is wrapped. This page shows the last four characters only.
                </span>
              </span>
            </label>
          </fieldset>

          {last4 ? (
            <p className="font-mono text-sm" data-key-last4={last4}>
              Saved key ····{last4}
              {state.key?.provider ? ` · ${state.key.provider}` : ""}.{" "}
              {state.mode === "platform"
                ? "Library jobs use platform credits while that is the org default."
                : "Library jobs use this key while it is the org default."}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground" data-key-last4="">
              No key on file.
            </p>
          )}

          {mode === "byok" ? (
            <div className="space-y-4">
              <label className="block text-sm">
                Provider
                <input
                  className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2"
                  name="provider"
                  value={provider}
                  autoComplete="off"
                  maxLength={32}
                  onChange={(event) => setProvider(event.target.value)}
                />
              </label>
              <label className="block text-sm">
                Key
                <input
                  className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2"
                  name="secret"
                  type="password"
                  value={secret}
                  autoComplete="off"
                  onChange={(event) => setSecret(event.target.value)}
                />
              </label>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-11 items-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground disabled:opacity-60"
            >
              Save org default
            </button>
            {last4 ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => void revoke()}
                className="inline-flex h-11 items-center rounded-xl border border-border px-5 text-sm"
              >
                Revoke key
              </button>
            ) : null}
          </div>
        </form>
      ) : null}
    </section>
  );
}
