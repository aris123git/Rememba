"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/clientApi";

export function UnknownPersonActions({ clusterId }: { clusterId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [isSelf, setIsSelf] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      const person = await api<{ id: string }>("/api/people", {
        method: "POST",
        body: JSON.stringify({
          clusterId,
          displayName: name,
          isUserSelf: isSelf,
          action: "confirm",
        }),
      });
      router.push(`/app/people/${person.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de confirmer");
      setBusy(false);
    }
  }

  async function other(action: "ignore" | "split") {
    setBusy(true);
    setError(null);
    try {
      await api("/api/people", {
        method: "POST",
        body: JSON.stringify({ clusterId, action }),
      });
      router.push("/app/people");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
      <h2 className="serif text-2xl">Qui est cette personne ?</h2>
      <p className="mt-1 text-sm text-[var(--muted)]">
        Suggestion uniquement. Associer un contact : TODO V2.
      </p>
      <label className="mt-4 block text-sm text-[var(--muted)]">
        Nom
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
          placeholder="Paul"
        />
      </label>
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isSelf} onChange={(e) => setIsSelf(e.target.checked)} />
        C’est moi
      </label>
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void confirm()}
          className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)] disabled:opacity-40"
        >
          Associer ce nom
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void other("split")}
          className="rounded-full border border-white/10 px-4 py-2 text-sm"
        >
          Ce sont plusieurs personnes
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void other("ignore")}
          className="rounded-full px-4 py-2 text-sm text-[var(--muted)]"
        >
          Ignorer
        </button>
      </div>
    </div>
  );
}
