"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/clientApi";
import { PhotoGrid } from "@/components/PhotoGrid";

type Suggestion = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
};

export function SuggestionCard({ suggestion }: { suggestion: Suggestion }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const photoIds = (suggestion.payload.samplePhotoIds || suggestion.payload.photoIds || []) as string[];
  const photoCount = Number(suggestion.payload.photoCount || photoIds.length);

  async function act(action: "dismiss" | "snooze" | "accept_event") {
    setBusy(true);
    setError(null);
    try {
      await api("/api/suggestions", {
        method: "POST",
        body: JSON.stringify({ id: suggestion.id, action, name: name || undefined }),
      });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action impossible");
    } finally {
      setBusy(false);
    }
  }

  if (suggestion.type === "PERSON_IDENTITY") {
    return (
      <article className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--gold)]">Suggestion de l’IA</p>
        <h3 className="serif mt-2 text-2xl">Une personne apparaît souvent</h3>
        <p className="mt-2 text-[var(--muted)]">
          Nous avons trouvé une personne qui apparaît sur {photoCount} photo{photoCount > 1 ? "s" : ""}.
          Ce n’est qu’une suggestion jusqu’à votre confirmation.
        </p>
        <div className="mt-4">
          <PhotoGrid photos={photoIds.slice(0, 4).map((id) => ({ id }))} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`/app/people/unknown/${String(suggestion.payload.clusterId)}`}
            className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)]"
          >
            Voir / nommer
          </a>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("snooze")}
            className="rounded-full border border-white/10 px-4 py-2 text-sm"
          >
            Pas maintenant
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => void act("dismiss")}
            className="rounded-full px-4 py-2 text-sm text-[var(--muted)]"
          >
            Ignorer
          </button>
        </div>
        {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
      </article>
    );
  }

  return (
    <article className="rounded-3xl border border-[var(--line)] bg-[var(--ink-soft)] p-5">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--gold)]">Suggestion de l’IA</p>
      <h3 className="serif mt-2 text-2xl">Événement possible</h3>
      <p className="mt-2 text-[var(--muted)]">
        {photoCount} photos semblent avoir été prises au même moment. Voulez-vous créer cet événement ?
      </p>
      <div className="mt-4">
        <PhotoGrid photos={photoIds.slice(0, 6).map((id) => ({ id }))} />
      </div>
      <label className="mt-4 block text-sm text-[var(--muted)]">
        Nom de l’événement
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Anniversaire de Sarah"
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[var(--paper)]"
        />
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || !name.trim()}
          onClick={() => void act("accept_event")}
          className="rounded-full bg-[var(--gold)] px-4 py-2 text-sm text-[var(--ink)] disabled:opacity-40"
        >
          Créer l’événement
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void act("snooze")}
          className="rounded-full border border-white/10 px-4 py-2 text-sm"
        >
          Pas maintenant
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void act("dismiss")}
          className="rounded-full px-4 py-2 text-sm text-[var(--muted)]"
        >
          Ignorer
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
    </article>
  );
}
