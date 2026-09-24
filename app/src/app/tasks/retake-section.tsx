"use client";

import { useState } from "react";
import { decideRetake } from "./retake-actions";

export function RetakeSection({
  requests,
}: {
  requests: Array<{ id: string; requesterName: string; status: string; createdAt: string }>;
}) {
  const [rows, setRows] = useState(requests);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function decide(id: string, status: "approved" | "denied") {
    setBusy(true);
    setError("");
    try {
      const result = await decideRetake(id, status);
      if (!result.ok) {
        setError(result.error || "Could not update the retake");
        return;
      }
      setRows((current) => current.filter((row) => row.id !== id));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card mt-6 p-6">
      <h2 className="text-lg font-semibold">Retake requests</h2>
      <p className="mt-2 text-sm text-gray-600">Open retake requests for people you coach.</p>
      {rows.length === 0 ? <p className="mt-3">No open retake requests.</p> : null}
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{row.requesterName}</p>
              <p className="text-sm text-gray-600">{row.status}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-primary" disabled={busy} onClick={() => void decide(row.id, "approved")}>
                Approve
              </button>
              <button type="button" className="btn" disabled={busy} onClick={() => void decide(row.id, "denied")}>
                Deny
              </button>
            </div>
          </li>
        ))}
      </ul>
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
