"use client";

import { useState } from "react";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  audience: string | null;
  active: boolean;
};

async function send(path: string, method: string, body?: unknown) {
  const response = await fetch(path, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await response.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    product?: ProductRow;
    brief?: { summary?: string };
  };
  if (!response.ok || data.ok === false) throw new Error(data.error || "request_failed");
  return data;
}

export function ProductsEditor({ initial }: { initial: ProductRow[] }) {
  const [rows, setRows] = useState(initial);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [audience, setAudience] = useState("");
  const [sources, setSources] = useState("");
  const [message, setMessage] = useState("");

  async function create() {
    setMessage("");
    try {
      const data = await send("/api/coaching/products", "POST", { name, summary, audience, active: true });
      if (data.product) setRows((current) => [data.product as ProductRow, ...current]);
      setName("");
      setSummary("");
      setMessage("Product saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function save(row: ProductRow) {
    setMessage("");
    try {
      const data = await send(`/api/coaching/products/${row.id}`, "PATCH", {
        name: row.name,
        summary: row.summary,
        audience: row.audience,
        active: row.active,
      });
      if (data.product) {
        setRows((current) => current.map((item) => (item.id === row.id ? (data.product as ProductRow) : item)));
      }
      setMessage("Product saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function remove(id: string) {
    setMessage("");
    try {
      await send(`/api/coaching/products/${id}`, "DELETE");
      setRows((current) => current.filter((item) => item.id !== id));
      setMessage("Product removed");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  async function synthesize(row: ProductRow) {
    setMessage("");
    const sourceTexts = sources
      .split("\n---\n")
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text, index) => ({ filename: `source-${index + 1}.txt`, text }));
    try {
      const data = await send("/api/coaching/products/synthesize", "POST", {
        productId: row.id,
        productName: row.name,
        audience: row.audience,
        sourceTexts,
      });
      if (data.product) {
        setRows((current) => current.map((item) => (item.id === row.id ? (data.product as ProductRow) : item)));
      }
      setMessage(data.brief?.summary || "Brief ready");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "request_failed");
    }
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="card p-4">
        <h2 className="text-sm font-semibold">New product</h2>
        <label className="mt-3 block text-sm font-semibold">
          Name
          <input className="input mt-1" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Summary
          <textarea className="input mt-1 min-h-20" value={summary} onChange={(event) => setSummary(event.target.value)} />
        </label>
        <label className="mt-3 block text-sm font-semibold">
          Audience
          <input className="input mt-1" value={audience} onChange={(event) => setAudience(event.target.value)} />
        </label>
        <button type="button" className="btn-primary mt-3" onClick={() => void create()}>
          Save product
        </button>
      </section>
      <section className="card p-4">
        <h2 className="text-sm font-semibold">Source text</h2>
        <textarea
          className="input mt-3 min-h-24"
          value={sources}
          onChange={(event) => setSources(event.target.value)}
          placeholder="Separate sources with a line of ---"
        />
      </section>
      {rows.length ? (
        <ul className="space-y-4">
          {rows.map((row) => (
            <li key={row.id} className="card p-4">
              <label className="block text-sm font-semibold">
                Name
                <input
                  className="input mt-1"
                  value={row.name}
                  onChange={(event) =>
                    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, name: event.target.value } : item)))
                  }
                />
              </label>
              <label className="mt-3 block text-sm font-semibold">
                Summary
                <textarea
                  className="input mt-1 min-h-20"
                  value={row.summary ?? ""}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item) => (item.id === row.id ? { ...item, summary: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <label className="mt-3 block text-sm font-semibold">
                Audience
                <input
                  className="input mt-1"
                  value={row.audience ?? ""}
                  onChange={(event) =>
                    setRows((current) =>
                      current.map((item) => (item.id === row.id ? { ...item, audience: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-primary" onClick={() => void save(row)}>
                  Save
                </button>
                <button type="button" className="btn-primary" onClick={() => void synthesize(row)}>
                  Synthesize brief
                </button>
                <button type="button" className="btn-primary" onClick={() => void remove(row.id)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <section className="card p-6">
          <p>No products yet.</p>
        </section>
      )}
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
