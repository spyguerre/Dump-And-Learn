"use client";

import { useState } from "react";

export default function Home() {
  const [nativeWord, setNativeWord] = useState("");
  const [foreignWord, setForeignWord] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch(`/api/words`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ native: nativeWord, foreign: foreignWord, description }),
      });
      if (!res.ok) {
        const data = await res.json();
        setStatus(`Error: ${data?.error || res.status}`);
        return;
      }
      const data = await res.json();
      setStatus(`Saved ${data.foreignWord}`);
      setNativeWord("");
      setForeignWord("");
      setDescription("");
    } catch (err: any) {
      setStatus(`Request failed: ${err?.message || String(err)}`);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center font-sans">
      <main className="w-full max-w-2xl p-8 shadow rounded">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Add a word</h1>
          <a href="/start-review" className="text-sm underline hover:opacity-80">
            Start Review
          </a>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col">
            <span className="font-medium">Native</span>
            <input
              value={nativeWord}
              onChange={(e) => setNativeWord(e.target.value)}
              required
              className="mt-1 border px-3 py-2 rounded"
            />
          </label>

          <label className="flex flex-col">
            <span className="font-medium">Foreign</span>
            <input
              value={foreignWord}
              onChange={(e) => setForeignWord(e.target.value)}
              required
              className="mt-1 border px-3 py-2 rounded"
            />
          </label>

          <label className="flex flex-col">
            <span className="font-medium">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 border px-3 py-2 rounded"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 rounded"
            >
              Save
            </button>
            {status && <div className="text-sm">{status}</div>}
          </div>
        </form>
      </main>
    </div>
  );
}
